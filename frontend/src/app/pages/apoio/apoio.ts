import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-apoio',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './apoio.html',
  styleUrls: ['./apoio.css']
})
export class ApoioComponent {
  filtroDistrito: string = '';

  recursos = [
    {
      distrito: 'Braga',
      nome: 'APAV Braga',
      tipo: 'Apoio psicológico e jurídico',
      contacto: '116 006',
      website: 'https://www.apav.pt',
      descricao: 'Apoio especializado a vítimas de crime e violência.'
    },
    {
      distrito: 'Porto',
      nome: 'APAV Porto',
      tipo: 'Apoio social e emocional',
      contacto: '116 006',
      website: 'https://www.apav.pt',
      descricao: 'Orientação, escuta e encaminhamento para serviços de proteção.'
    },
    {
      distrito: 'Lisboa',
      nome: 'CIG Lisboa',
      tipo: 'Apoio à violência doméstica',
      contacto: '800 202 148',
      website: 'https://www.cig.gov.pt',
      descricao: 'Linha e recursos de apoio em situações de violência doméstica.'
    },
    {
      distrito: 'Coimbra',
      nome: 'APAV Coimbra',
      tipo: 'Apoio jurídico',
      contacto: '116 006',
      website: 'https://www.apav.pt',
      descricao: 'Acompanhamento e informação sobre direitos e proteção.'
    },
    {
      distrito: 'Faro',
      nome: 'GAV Faro',
      tipo: 'Apoio psicológico',
      contacto: '800 202 148',
      website: 'https://www.cig.gov.pt',
      descricao: 'Apoio emocional e encaminhamento para rede local.'
    },
    {
      distrito: 'Aveiro',
      nome: 'APAV Aveiro',
      tipo: 'Apoio social',
      contacto: '116 006',
      website: 'https://www.apav.pt',
      descricao: 'Acolhimento e informação para vítimas em situação vulnerável.'
    }
  ];

  get recursosFiltrados() {
    const termo = this.filtroDistrito.trim().toLowerCase();

    if (!termo) {
      return this.recursos;
    }

    return this.recursos.filter((recurso) =>
      recurso.distrito.toLowerCase().includes(termo)
    );
  }
}