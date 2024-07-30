import { Component, inject } from '@angular/core';
import { Product } from 'src/app/models/products.models';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { AddUpdateProductComponent } from 'src/app/shared/components/add-update-product/add-update-product.component';
import { orderBy } from 'firebase/firestore';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage {
  firebaseSvc = inject(FirebaseService);
  utilSvc = inject(UtilsService);

  products: Product[] = [];
  loading: boolean = false;

  user(): User {
    return this.utilSvc.getFromLocalStorager('user');
  }

  ionViewWillEnter() {
    this.getProduct();
  }
  doRefresh(event) {
    setTimeout(() => {
      this.getProduct();
      event.target.complete();
    }, 1000);
  }

  //Obtener ganancias

  getProfits() {
    return this.products.reduce(
      (index, product) => index + product.price * product.soldUnits,
      0
    );
  }

  // Confirmar la eliminacion del producto

  async condirmDeleteProduct(product: Product) {
    this.utilSvc.presentAlert({
      header: 'Eliminar producto!',
      message: 'Quieres eliminar este producto?',
      mode: 'ios',
      buttons: [
        {
          text: 'Cancelar',
        },
        {
          text: 'Si, eliminar',
          handler: () => {
            this.deleteProduct(product);
          },
        },
      ],
    });
  }
  // Cerrar Sesion
  signOut() {
    this.firebaseSvc.signOut();
  }

  //Obtener Producto

  getProduct() {
    let path = `users/${this.user().uid}/products`;

    this.loading = true;

    let query = orderBy('soldUnits', 'desc');

    let sub = this.firebaseSvc.getCollectionData(path, query).subscribe({
      next: (res: any) => {
        console.log(res);
        this.products = res;

        this.loading = false;
        sub.unsubscribe();
      },
    });
  }
  // Agregar o actualizar un producto

  async addUpdateProduct(product?: Product) {
    let succes = await this.utilSvc.presentModal({
      component: AddUpdateProductComponent,
      cssClass: 'add-update-modal',
      componentProps: { product },
    });

    if (succes) this.getProduct();
  }

  // Eliminar Producto

  async deleteProduct(product: Product) {
    let path = `users/${this.user().uid}/products/${product.id}`;
    const loading = await this.utilSvc.loading();
    await loading.present;

    let imagePath = await this.firebaseSvc.getFilePath(product.image);

    await this.firebaseSvc.deleteFile(imagePath);

    this.firebaseSvc
      .deleteDocument(path)
      .then(async (res) => {
        this.products = this.products.filter((p) => p.id !== product.id);

        this.utilSvc.presentToast({
          message: 'Producto eliminado exitosamente',
          duration: 1500,
          color: 'success',
          position: 'middle',
          icon: 'checkmark-circle-outline',
        });
      })
      .catch((error) => {
        console.log(error);
        this.utilSvc.presentToast({
          message: error.message,
          duration: 2500,
          color: 'danger',
          position: 'middle',
          icon: 'alert-circle-outline',
        });
      })
      .finally(() => {
        loading.dismiss();
      });
  }
}
