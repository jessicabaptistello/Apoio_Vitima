import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecursoDetalhe } from './recurso-detalhe';

describe('RecursoDetalhe', () => {
  let component: RecursoDetalhe;
  let fixture: ComponentFixture<RecursoDetalhe>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecursoDetalhe],
    }).compileComponents();

    fixture = TestBed.createComponent(RecursoDetalhe);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
