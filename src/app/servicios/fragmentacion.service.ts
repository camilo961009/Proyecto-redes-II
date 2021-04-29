import { Injectable } from '@angular/core';
import { Datagrama } from '../modelos/datagrama';
import { Form } from '../modelos/form';

@Injectable({
  providedIn: 'root',
})
export class FragmentacionService {

  mtu: number;
  longitudTotal: number;

  version = 4;
  longitudEncabezado = 20;
  serviciosDiferenciados = 0;
  identificacion: number;
  tiempoDeVida: number;
  flags: string;
  tocaFragmentar: number;
  bitReservado: number;
  

  
  fragmentos: Datagrama[];
  fragmentosHexadecimal: string[];
  fragmentosBinario: string[][];
  numeroFragmentos: number;
  

  constructor() {
    this.fragmentos = [];
    this.fragmentosHexadecimal = [];
    this.fragmentosBinario = [];
    this.identificacion = 0;
    this.tiempoDeVida = 0;
    this.flags = '';
    this.tocaFragmentar = 0;
    this.bitReservado = 0;
    this.numeroFragmentos = 1;
    this.mtu = 0;
    this.longitudTotal = 0;

  }



  fragmento(datagrama: Form): Datagrama[] {
    this.mtu = datagrama.mtu;
    this.longitudTotal = datagrama.longitudTotal;
    this.fragmentos = [];
    this.fragmentosHexadecimal = [];
    this.fragmentosBinario = [];
    this.identificacion = this.random(0, 65535);
    this.tiempoDeVida = this.random(0, 255);
    this.tocaFragmentar = this.requiresFragmenting(datagrama.mtu - 20, datagrama.longitudTotal );
    this.numeroFragmentos = 1;
    let offset = 0;
    let morefragmentos = 1;
    let length = datagrama.mtu;

    if (!this.tocaFragmentar) {
      this.numeroFragmentos = this.calcularCantidadDeFragmentos(datagrama.mtu - 20,datagrama.longitudTotal );
    }

    for (let index = 0; index < this.numeroFragmentos; index++) {
      if (this.numeroFragmentos - 1 == index) {
        morefragmentos = 0;
        length = datagrama.longitudTotal - index * (datagrama.mtu - 20) ;
      }

      if (index !== 0) {
        offset += datagrama.mtu - 20;
      }

      this.flags = '' + this.bitReservado + this.tocaFragmentar + morefragmentos;

      this.fragmentos.push({
        index: index + 1,
        version: this.version,
        longitudEncabezado: this.longitudEncabezado,
        serviciosDiferenciados: this.serviciosDiferenciados,
        longitudTotal: length,
        identificacion: this.identificacion,
        flags: this.flags,
        desplazamineto: offset,
        tiempoDeVida: this.tiempoDeVida,
        protocolo: datagrama.protocolo,
        sumaDeComprobacion: 0,
        ipOrigen: datagrama.ipOrigen,
        ipDestino: datagrama.ipDestino,
      });
    }

    this.fragmentosEnBinario();
    this.FragmentosHexadecimal();
    this.loadsumaDeComprobacionToBinary();

    return this.fragmentos;
  }



  random(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  generarMtu(min: number, max: number): number {
    let mtu: number;

    do {
      mtu = Math.floor(Math.random() * (max - min + 1) + min);
    } while (mtu % 8 !== 0);

    return mtu + 20;
  }

  calcularCantidadDeFragmentos(mtu: number, longitudTotal: number): number {
    let numeroFragmentos = Math.floor(longitudTotal / mtu);

    if (longitudTotal % mtu !== 0) {
      numeroFragmentos++;
    }

    return numeroFragmentos;
  }

  requiresFragmenting(mtu: number, longitudTotal: number): number {
    if (longitudTotal > mtu) {
      return 0;
    }
    return 1;
  }

  fragmentosEnBinario(): void {
    let protocoloDec = 0;
    let ipOrigenDec = [];
    let ipDestinoDec = [];

    this.fragmentos.forEach((element) => {
      const version = this.convert(element.version, 2, 4);
      const longitudEncabezado = this.convert((element.longitudEncabezado / 4), 2, 4);
      const serviciosDiferenciados = this.convert(
        element.serviciosDiferenciados,
        2,
        8
      );
      const longitudTotal = this.convert(element.longitudTotal, 2, 16);
      const identificacion = this.convert(element.identificacion, 2, 16);
      const desplazamineto = this.convert((element.desplazamineto / 8), 2, 13);
      const tiempoDeVida = this.convert(element.tiempoDeVida, 2, 8);
      if (element.protocolo === 'ICMP') {
        protocoloDec = 1;
      } else if (element.protocolo === 'TCP') {
        protocoloDec = 6;
      } else {
        protocoloDec = 17;
      }
      const protocolo = this.convert(protocoloDec, 2, 8);
      ipOrigenDec = element.ipOrigen.split('.');
      let ipOrigenBin = '';
      for (let i = 0; i < ipOrigenDec.length; i++) {
        ipOrigenBin += this.convert(Number(ipOrigenDec[i]), 2, 8);
      }
      ipDestinoDec = element.ipDestino.split('.');
      let ipDestinoBin = '';
      for (let i = 0; i < ipDestinoDec.length; i++) {
        ipDestinoBin += this.convert(Number(ipDestinoDec[i]), 2, 8);
      }

      const line0 =
        version + longitudEncabezado + serviciosDiferenciados + longitudTotal;
      const line1 = identificacion + element.flags + desplazamineto;
      const line2 = tiempoDeVida + protocolo + '0000000000000000';
      const line3 = ipOrigenBin;
      const line4 = ipDestinoBin;

      const fragmentBin = [line0, line1, line2, line3, line4];
      this.fragmentosBinario.push(fragmentBin);
    });
  }

  FragmentosHexadecimal(): void {
    let DatagramaHexa: string;

    for (let i = 0; i < this.fragmentosBinario.length; i++) {
      DatagramaHexa = '';

      for (let j = 0; j < this.fragmentosBinario[i].length; j++) {
        const element = parseInt(this.fragmentosBinario[i][j].substring(0, 8), 2);
        const element1 = parseInt(this.fragmentosBinario[i][j].substring(8, 16), 2);
        const element2 = parseInt(this.fragmentosBinario[i][j].substring(16, 24), 2);
        const element3 = parseInt(this.fragmentosBinario[i][j].substring(24), 2);

        const hexa = this.convert(element, 16, 2);
        const hexa1 = this.convert(element1, 16, 2);
        const hexa2 = this.convert(element2, 16, 2);
        const hexa3 = this.convert(element3, 16, 2);

        DatagramaHexa += hexa + ' ' + hexa1 + ' ' + hexa2 + ' ' + hexa3 + '\n';
      }

      this.sumaDeComprobacion(DatagramaHexa);
    }
  }

  sumaDeComprobacion(DatagramaHexa: string): void {
    const DatagramaAux = DatagramaHexa.split(' ').join('').split('\n').join('');
    let acum = parseInt(DatagramaAux.substring(0, 4), 16);
    let current: number;
    let aux: string;
    let aux1: number;

    for (let i = 4; i < 40; i += 4) {
      current = parseInt(DatagramaAux.substring(i, i + 4), 16);

      acum += current;
      aux = acum.toString(16);

      if (aux.length === 5) {
        aux = aux.substring(1);
        aux1 = parseInt(aux, 16);
        acum = aux1 + 1;
      }
    }

    acum = 65535 - acum;
    aux = this.convert(acum, 16, 4);
    aux = aux.substring(0, 2) + ' ' + aux.substring(2);

    DatagramaHexa =
      DatagramaHexa.substring(0, 30) + aux + DatagramaHexa.substring(35);

    this.fragmentosHexadecimal.push(DatagramaHexa);
  }

  loadsumaDeComprobacionToBinary(): void {
    for (let i = 0; i < this.fragmentosHexadecimal.length; i++) {
      const aux = parseInt(
        this.fragmentosHexadecimal[i].substring(30, 32) +
          this.fragmentosHexadecimal[i].substring(33, 35),
        16
      );

      const aux1 = this.convert(aux, 2, 16);

      this.fragmentos[i].sumaDeComprobacion = aux;

      this.fragmentosBinario[i][2] = this.fragmentosBinario[i][2].substring(0, 16) + aux1;
    }
  }

  convert(data: number, base: number, numBits: number): string {
    let num = data.toString(base);
    const zero = numBits - num.length;

    for (let i = 0; i < zero; i++) {
      num = '0' + num;
    }

    return num;
  }

  generarAleatorio(): Datagrama[] {
    this.mtu = this.generarMtu(48, 1480);
    this.longitudTotal = this.random(576, 65535);
    const protocoloCode = this.random(0, 2);
    let protocoloAux = 'ICPM';
    const source1 = this.random(0, 255);
    const source2 = this.random(0, 255);
    const destination1 = this.random(0, 255);
    const destination2 = this.random(0, 255);

    if (protocoloCode === 1) {
      protocoloAux = 'TCP';
    } else if (protocoloCode === 2) {
      protocoloAux = 'UDP';
    }

    const data: Form = {
      mtu: this.mtu,
      longitudTotal: this.longitudTotal,
      protocolo: protocoloAux,
      ipOrigen: '192.168.' + source1 + '.' + source2,
      ipDestino: '192.168.' + destination1 + '.' + destination2,
    };

    return this.fragmento(data);
  }

  
  getfragmentosHexadecimal(): string[] {
    return this.fragmentosHexadecimal;
  }

  getfragmentosBinario(): string[][] {
    return this.fragmentosBinario;
  }

  getMTU(): number {
    return this.mtu;
  }

  getLength(): number {
    return this.longitudTotal;
  }
}
