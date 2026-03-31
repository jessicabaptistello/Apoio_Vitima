import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { LoginComponent } from './pages/login/login';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { ApoioComponent } from './pages/apoio/apoio';
import { DetalheRecursoComponent } from './pages/recurso-detalhe/recurso-detalhe';
import { ConscientizacaoComponent } from './pages/conscientizacao/conscientizacao';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'apoio', component: ApoioComponent },
  { path: 'apoio/:id', component: DetalheRecursoComponent },
  { path: 'conscientizacao', component: ConscientizacaoComponent },
  { path: '**', redirectTo: '' }
];