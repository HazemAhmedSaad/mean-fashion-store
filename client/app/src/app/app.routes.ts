import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { LoginComponent } from './features/public/login/login.component';
import { SignupComponent } from './features/public/signup/signup.component';
import { ProductListComponent } from './features/public/product-list/product-list.component';
import { HomeComponent } from './features/public/home/home.component';
import { ProductDetailsComponent } from './features/public/product-details/product-details.component';
import { CartComponent } from './features/public/cart/cart.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { ProductsControlComponent } from './features/admin/products-control/products-control.component';
import { CategoryControlComponent } from './features/admin/category-control/category-control.component';
import { OrderControlComponent } from './features/admin/order-control/order-control.component';
import { UserControlComponent } from './features/admin/user-control/user-control.component';
import { SubCategoryControlComponent } from './features/admin/sub-category-control/sub-category-control.component';
import { NotFoundComponent } from './features/public/not-found/not-found.component';
import { ProfileComponent } from './features/public/profile/profile.component';
import { roleGuard } from './core/guards/role.guard';
import { MyOrdersComponent } from './features/public/my-orders/my-orders.component';
import { TestimonialsComponent } from './features/public/testimonials/testimonials.component';


export const routes: Routes = [
    {
        path: '', component: PublicLayoutComponent, children: [
            { path: '', redirectTo: 'home', pathMatch: 'full' },
            { path: 'login', component: LoginComponent },
            { path: 'signup', component: SignupComponent },
            { path: 'profile', component: ProfileComponent },
            { path: 'home', component: HomeComponent },
            { path: 'products', component: ProductListComponent },
            { path: 'products/:slug/:id', component: ProductDetailsComponent },
            { path: 'products/:slug', component: ProductDetailsComponent },
            { path: 'cart', component: CartComponent },
            { path: 'orders', component: MyOrdersComponent },

        ]
    },
    {
        path: 'admin',
        component: AdminLayoutComponent, canActivate: [roleGuard],
        canActivateChild: [roleGuard],
        data: { expectedRole: 'admin' },
        children: [
            { path: '', redirectTo: 'products-control', pathMatch: 'full' },
            { path: 'products-control', component: ProductsControlComponent },
            { path: 'categories-control', component: CategoryControlComponent },
            { path: 'orders-control', component: OrderControlComponent },
            { path: 'users-control', component: UserControlComponent },
            { path: 'testimonials-control', component: TestimonialsComponent },
            { path: "sub-categories-control", component: SubCategoryControlComponent},
        ]
    },
    { path: '**', component: NotFoundComponent }

];
