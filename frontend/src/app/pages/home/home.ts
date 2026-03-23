import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html', // Ajustado para o teu ficheiro real
  styleUrl: './home.css'      // Ajustado para o teu ficheiro real
})
export class HomeComponent { }