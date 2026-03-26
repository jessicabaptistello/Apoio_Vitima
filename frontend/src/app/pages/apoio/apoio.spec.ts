import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Apoio } from './apoio';

describe('Apoio', () => {
  let component: Apoio;
  let fixture: ComponentFixture<Apoio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Apoio],
    }).compileComponents();

    fixture = TestBed.createComponent(Apoio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
