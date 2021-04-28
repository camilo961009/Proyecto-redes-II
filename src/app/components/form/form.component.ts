import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { FragmenterService } from '../../services/fragmenter.service';
import { Datagram } from '../../models/datagram';
import swal from 'sweetalert2'


@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styles: ['./componentes/form.component.css'
  ]
})
export class FormComponent implements OnInit {

  panelOpenState = false;
  reactiveForm: FormGroup;
  data: Datagram[] = [];
  dataHexa: string[] = [];
  dataBin: string[][] = [];
  pageSliceDec: Datagram[] = [];
  pageSliceHexa: string[] = [];
  pageSliceBin: string[][] = [];
  patternIP: string;
  randomMTU: number;
  randomLength: number;
  protocol:string;

  constructor(
    private formBuilder: FormBuilder,
    private fragmenterService: FragmenterService
  ) {

    this.randomMTU = 0;
    this.randomLength = 0;
    this.patternIP = '^([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\\.' +
    '(([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\\.){2}' +
    '([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])$';
    this.reactiveForm = this.createForm();

  }

  ngOnInit(): void {
  
  }

  createForm(): FormGroup {
    return this.formBuilder.group({
      mtu: ['', [Validators.required, Validators.min(68), Validators.max(1500)]],
      totalLength: ['', [Validators.required, Validators.min(576), Validators.max(65535)]],
      protocol : ['ICMP', [Validators.required]],
      sourceIP: ['', [Validators.required, Validators.pattern(this.patternIP)]],
      destinationIP: ['', [Validators.required, Validators.pattern(this.patternIP)]]
    });
  }

  save(): void {

    this.data = this.fragmenterService.fragment(this.reactiveForm.value);
    this.dataHexa = this.fragmenterService.getFragmentsHexa();
    this.dataBin = this.fragmenterService.getFragmentsBin();
    this.randomMTU = this.fragmenterService.getMTU();
    this.randomLength = this.fragmenterService.getLength();
    this.pageSliceDec = this.data.slice(0, 3);
    this.pageSliceHexa = this.dataHexa.slice(0, 3);
    this.pageSliceBin = this.dataBin.slice(0, 3);
    this.reactiveForm = this.createForm();
    swal.fire('Fragmento(s)', `Fragmento(s) creados con exito éxito!`, 'success')

  }

  aleatory(): void {
    this.data = this.fragmenterService.aleatory();
    this.dataHexa = this.fragmenterService.getFragmentsHexa();
    this.dataBin = this.fragmenterService.getFragmentsBin();
    this.randomMTU = this.fragmenterService.getMTU();
    this.randomLength = this.fragmenterService.getLength();
    this.pageSliceDec = this.data.slice(0, 3);
    this.pageSliceHexa = this.dataHexa.slice(0, 3);
    this.pageSliceBin = this.dataBin.slice(0, 3);
    this.reactiveForm = this.createForm();
  }
  onPageChange(event: PageEvent): void {

    const startIndex = event.pageIndex * event.pageSize;
    let endIndex = startIndex + event.pageSize;

    if (endIndex > this.data.length) {
      endIndex = this.data.length;
    }

    this.pageSliceDec = this.data.slice(startIndex, endIndex);
    this.pageSliceHexa = this.dataHexa.slice(startIndex, endIndex);
    this.pageSliceBin = this.dataBin.slice(startIndex, endIndex);

  }

}
