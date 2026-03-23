import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'saudacao',
})
export class SaudacaoPipe implements PipeTransform {
  transform(nome: string): string {
    const hora = new Date().getHours();

    if (hora < 12) {
      return `"bom dia", ${nome}`;
    }

    if (hora < 18) {
      return `"bom tarde", ${nome}`;
    }
      return `"Boa noite", ${nome}`;
    
    }
  }


