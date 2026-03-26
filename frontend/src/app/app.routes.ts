import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { HomeComponent } from './pages/home/home';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { ApoioComponent } from './pages/apoio/apoio';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'apoio', component: ApoioComponent },
  { path: '**', redirectTo: '' }
];