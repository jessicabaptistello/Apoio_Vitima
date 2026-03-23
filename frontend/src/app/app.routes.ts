import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { HomeComponent } from './pages/home/home';
import { DashboardComponent } from './pages/dashboard/dashboard';

export const routes: Routes = [
  { path: '', component: HomeComponent},
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent },
  { path: 'dashboard', component: DashboardComponent}
];