import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { FragmentacionService } from '../../servicios/fragmentacion.service';
import { Datagrama } from '../../modelos/datagrama';
import swal from 'sweetalert2'


@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styles: ['./componentes/form.component.css'
  ]
})
export class FormComponent implements OnInit {

  mtu: number;
  longitudTotal: number;
  reactiveForm: FormGroup;
  datagrama: Datagrama[] = [];
  datagramaHexadecimal: string[] = [];
  datagramaBinario: string[][] = [];
  patternIP: string;
  protocolo:string;

  constructor(
    private formBuilder: FormBuilder,
    private FragmentacionService: FragmentacionService
  ) {

    this.mtu = 0;
    this.longitudTotal = 0;
    this.patternIP = '^([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\\.' +
    '(([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\\.){2}' +
    '([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])$';
    this.reactiveForm = this.crearFormulario();

  }

  ngOnInit(): void {
  
  }

  crearFormulario(): FormGroup {
    return this.formBuilder.group({
      mtu: ['', [Validators.required, Validators.min(68), Validators.max(1500)]],
      longitudTotal: ['', [Validators.required, Validators.min(576), Validators.max(65535)]],
      protocolo : ['ICMP', [Validators.required]],
      ipOrigen: ['', [Validators.required, Validators.pattern(this.patternIP)]],
      ipDestino: ['', [Validators.required, Validators.pattern(this.patternIP)]]
    });
  }

  fragmentar(): void {

    this.datagrama = this.FragmentacionService.fragmento(this.reactiveForm.value);
    this.datagramaHexadecimal = this.FragmentacionService.getfragmentosHexadecimal();
    this.datagramaBinario = this.FragmentacionService.getfragmentosBinario();
    this.mtu = this.FragmentacionService.getMTU();
    this.longitudTotal = this.FragmentacionService.getLength();
    this.reactiveForm = this.crearFormulario();
    swal.fire('Fragmento(s)', `Fragmento(s) creados con exito éxito!`, 'success')

  }

  generarAleatorio(): void {
    this.datagrama = this.FragmentacionService.generarAleatorio();
    this.datagramaHexadecimal = this.FragmentacionService.getfragmentosHexadecimal();
    this.datagramaBinario = this.FragmentacionService.getfragmentosBinario();
    this.mtu = this.FragmentacionService.getMTU();
    this.longitudTotal = this.FragmentacionService.getLength();
    this.reactiveForm = this.crearFormulario();
  }

}