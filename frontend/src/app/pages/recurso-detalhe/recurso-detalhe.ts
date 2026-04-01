import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-detalhe-recurso',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './recurso-detalhe.html',
  styleUrls: ['./recurso-detalhe.css']
})
export class DetalheRecursoComponent implements OnInit {
  recurso: any = null;
  carregando = true;

  constructor(
    private route: ActivatedRoute,
    private supabaseService: SupabaseService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.carregarDetalhe();
  }

  async carregarDetalhe() {
    this.carregando = true;
    this.cdr.detectChanges();

    const idParam = this.route.snapshot.paramMap.get('id');
    const id = Number(idParam);

    if (!idParam || isNaN(id)) {
      console.error('ID inválido na rota:', idParam);
      this.recurso = null;
      this.carregando = false;
      this.cdr.detectChanges();
      return;
    }

    const { data, error } = await this.supabaseService.supabase
      .from('recursos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao carregar detalhe do recurso:', error.message);
      this.recurso = null;
      this.carregando = false;
      this.cdr.detectChanges();
      return;
    }

    this.recurso = data;
    this.carregando = false;
    this.cdr.detectChanges();
  }
}