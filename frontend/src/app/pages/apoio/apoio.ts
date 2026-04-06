import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { Recurso, SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-apoio',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './apoio.html',
  styleUrls: ['./apoio.css']
})
export class ApoioComponent implements OnInit {
  filtroDistrito = '';
  filtroTipo = '';
  pesquisa = '';

  recursos: Recurso[] = [];
  carregando = true;
  enviandoSugestao = false;

  readonly contactoPattern = '^[0-9]{9,15}$';

  modalOpen = false;
  modalTitle = '';
  modalMessage = '';

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

  async ngOnInit(): Promise<void> {
    await this.carregarRecursos();
  }

  abrirModal(titulo: string, mensagem: string): void {
    this.modalTitle = titulo;
    this.modalMessage = mensagem;
    this.modalOpen = true;
    this.cdr.detectChanges();
  }

  fecharModal(): void {
    this.modalOpen = false;
    this.modalTitle = '';
    this.modalMessage = '';
    this.cdr.detectChanges();
  }

  async carregarRecursos(): Promise<void> {
    this.carregando = true;
    this.cdr.detectChanges();

    try {
      this.recursos = (await this.supabaseService.obterRecursos()) ?? [];
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

  get recursosFiltrados(): Recurso[] {
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

  public websiteOuEmailValido(valor: string): boolean {
    const texto = (valor || '').trim();

    if (!texto) return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const websiteRegex = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/.*)?$/i;

    return emailRegex.test(texto) || websiteRegex.test(texto);
  }

  private limparContacto(valor: string): string {
    return (valor || '').replace(/\D/g, '');
  }

  async sugerirNovoRecurso(form?: NgForm): Promise<void> {
    if (this.enviandoSugestao) return;

    const nome = this.novoRecurso.nome.trim();
    const tipo = this.novoRecurso.tipo.trim();
    const contactoOriginal = this.novoRecurso.contacto.trim();
    const contacto = this.limparContacto(contactoOriginal);
    const website = this.novoRecurso.website.trim();
    const distrito = this.novoRecurso.distrito.trim();
    const descricao = this.novoRecurso.descricao.trim();

    if (!nome || !tipo || !contactoOriginal || !website || !distrito || !descricao) {
      this.abrirModal('Campos obrigatórios', 'Todos os campos do recurso são obrigatórios.');
      return;
    }

    if (nome.length < 3) {
      this.abrirModal('Nome inválido', 'O nome do recurso deve ter pelo menos 3 caracteres.');
      return;
    }

    if (tipo.length < 4) {
      this.abrirModal('Tipo inválido', 'O tipo de apoio deve ter pelo menos 4 caracteres.');
      return;
    }

    if (!/^[0-9]{9,15}$/.test(contacto)) {
      this.abrirModal('Contacto inválido', 'O contacto deve conter apenas números e ter entre 9 e 15 dígitos.');
      return;
    }

    if (!this.websiteOuEmailValido(website)) {
      this.abrirModal('Website ou email inválido', 'Introduza um website ou email válido.');
      return;
    }

    if (descricao.length < 10) {
      this.abrirModal('Descrição inválida', 'A descrição deve ter no mínimo 10 caracteres.');
      return;
    }

    this.enviandoSugestao = true;
    this.cdr.detectChanges();

    try {
      const { error } = await this.supabaseService.sugerirRecurso(
        nome,
        tipo,
        contacto,
        website,
        distrito,
        descricao
      );

      if (error) {
        this.abrirModal('Erro ao enviar sugestão', error.message);
        return;
      }

      this.abrirModal(
        'Sugestão enviada',
        'Sugestão enviada com sucesso! O recurso ficou pendente até aprovação do administrador.'
      );

      this.novoRecurso = {
        nome: '',
        tipo: '',
        contacto: '',
        website: '',
        distrito: '',
        descricao: ''
      };

      if (form) {
        form.resetForm();
      }
    } finally {
      this.enviandoSugestao = false;
      this.cdr.detectChanges();
    }
  }
}