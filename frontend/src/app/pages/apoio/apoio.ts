import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-apoio',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './apoio.html',
  styleUrls: ['./apoio.css']
})
export class ApoioComponent implements OnInit {
  filtroDistrito: string = '';
  filtroTipo: string = '';
  pesquisa: string = '';

  recursos: any[] = [];
  carregando: boolean = true;

  novoRecurso = {
    nome: '',
    tipo: '',
    contacto: '',
    website: '',
    distrito: '',
    descricao: ''
  };

  constructor(
    private supabaseService: SupabaseService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.carregarRecursos();
  }

  async carregarRecursos() {
    this.carregando = true;
    this.cdr.detectChanges();

    try {
      this.recursos = await this.supabaseService.obterRecursos();
    } catch (error) {
      console.error('Erro ao carregar recursos:', error);
      this.recursos = [];
    } finally {
      this.carregando = false;
      this.cdr.detectChanges();
    }
  }

  get tiposDisponiveis(): string[] {
    const tipos = this.recursos.map((recurso) => recurso.tipo);
    return [...new Set(tipos)].sort();
  }

  get recursosFiltrados() {
    const distrito = this.filtroDistrito.trim().toLowerCase();
    const tipo = this.filtroTipo.trim().toLowerCase();
    const termo = this.pesquisa.trim().toLowerCase();

    return this.recursos.filter((recurso) => {
      const matchDistrito =
        !distrito || recurso.distrito?.toLowerCase().includes(distrito);

      const matchTipo =
        !tipo || recurso.tipo?.toLowerCase() === tipo;

      const matchPesquisa =
        !termo ||
        recurso.nome?.toLowerCase().includes(termo) ||
        recurso.tipo?.toLowerCase().includes(termo) ||
        recurso.distrito?.toLowerCase().includes(termo) ||
        recurso.descricao?.toLowerCase().includes(termo);

      return matchDistrito && matchTipo && matchPesquisa;
    });
  }

  async sugerirNovoRecurso() {
    const { nome, tipo, contacto, website, distrito, descricao } = this.novoRecurso;

    if (!nome || !tipo || !contacto || !website || !distrito) {
      alert('Preencha nome, tipo, contacto, website e distrito.');
      return;
    }

    const { error } = await this.supabaseService.sugerirRecurso(
      nome,
      tipo,
      contacto,
      website,
      distrito,
      descricao
    );

    if (error) {
      alert('Erro ao enviar sugestão: ' + error.message);
      return;
    }

    alert('Sugestão enviada com sucesso! O recurso ficará pendente até aprovação.');

    this.novoRecurso = {
      nome: '',
      tipo: '',
      contacto: '',
      website: '',
      distrito: '',
      descricao: ''
    };

    this.cdr.detectChanges();
  }
}