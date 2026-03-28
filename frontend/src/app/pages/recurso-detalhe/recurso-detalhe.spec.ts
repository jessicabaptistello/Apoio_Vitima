import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { DetalheRecursoComponent } from './recurso-detalhe';

describe('DetalheRecursoComponent', () => {
  let component: DetalheRecursoComponent;
  let fixture: ComponentFixture<DetalheRecursoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalheRecursoComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => '1'
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DetalheRecursoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});