import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Conscientizacao } from './conscientizacao';

describe('Conscientizacao', () => {
  let component: Conscientizacao;
  let fixture: ComponentFixture<Conscientizacao>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Conscientizacao],
    }).compileComponents();

    fixture = TestBed.createComponent(Conscientizacao);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
