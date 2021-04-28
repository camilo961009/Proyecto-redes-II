import { Injectable } from '@angular/core';
import { Datagram } from '../models/datagram';
import { Form } from '../models/form';

@Injectable({
  providedIn: 'root',
})
export class FragmenterService {
  fragments: Datagram[];
  fragmentsHexa: string[];
  fragmentsBin: string[][];
  numFragments: number;
  version = 4;
  headerLength = 20;
  differentiatedServices = 0;
  identification: number;
  timeOfLife: number;
  flags: string;
  dontFragment: number;
  reservedBit: number;
  randomMTU: number;
  randomLength: number;


  constructor() {
    this.fragments = [];
    this.fragmentsHexa = [];
    this.fragmentsBin = [];
    this.identification = 0;
    this.timeOfLife = 0;
    this.flags = '';
    this.dontFragment = 0;
    this.reservedBit = 0;
    this.numFragments = 1;
    this.randomMTU = 0;
    this.randomLength = 0;

  }

  aleatory(): Datagram[] {
    this.randomMTU = this.generateMTU(48, 1480);
    this.randomLength = this.random(576, 65535);
    const protocolCode = this.random(0, 2);
    let protocolAux = 'ICPM';
    const source1 = this.random(0, 255);
    const source2 = this.random(0, 255);
    const destination1 = this.random(0, 255);
    const destination2 = this.random(0, 255);

    if (protocolCode === 1) {
      protocolAux = 'TCP';
    } else if (protocolCode === 2) {
      protocolAux = 'UDP';
    }

    const data: Form = {
      mtu: this.randomMTU,
      totalLength: this.randomLength,
      protocol: protocolAux,
      sourceIP: '192.168.' + source1 + '.' + source2,
      destinationIP: '192.168.' + destination1 + '.' + destination2,
    };

    return this.fragment(data);
  }

  fragment(data: Form): Datagram[] {
    this.randomMTU = data.mtu;
    this.randomLength = data.totalLength;
    this.fragments = [];
    this.fragmentsHexa = [];
    this.fragmentsBin = [];
    this.identification = this.random(0, 65535);
    this.timeOfLife = this.random(0, 255);
    this.dontFragment = this.requiresFragmenting(
      data.mtu - 20,
      data.totalLength
    );
    this.numFragments = 1;
    let offset = 0;
    let moreFragments = 1;
    let length = data.mtu;

    if (!this.dontFragment) {
      this.numFragments = this.calculateNumFragments(
        data.mtu - 20,
        data.totalLength
      );
    }

    for (let index = 0; index < this.numFragments; index++) {
      if (this.numFragments - 1 === index) {
        moreFragments = 0;
        length = data.totalLength - index * (data.mtu - 20) ;
      }

      if (index !== 0) {
        offset += data.mtu - 20;
      }

      this.flags = '' + this.reservedBit + this.dontFragment + moreFragments;

      this.fragments.push({
        index: index + 1,
        version: this.version,
        headerLength: this.headerLength,
        differentiatedServices: this.differentiatedServices,
        totalLength: length,
        identification: this.identification,
        flags: this.flags,
        displacement: offset,
        timeOfLife: this.timeOfLife,
        protocol: data.protocol,
        checksum: 0,
        sourceIP: data.sourceIP,
        destinationIP: data.destinationIP,
      });
    }

    this.fragmentInBinary();
    this.fragmentInHexa();
    this.loadCheckSumToBinary();

    return this.fragments;
  }

  getFragmentsHexa(): string[] {
    return this.fragmentsHexa;
  }

  getFragmentsBin(): string[][] {
    return this.fragmentsBin;
  }

  getMTU(): number {
    return this.randomMTU;
  }

  getLength(): number {
    return this.randomLength;
  }

  random(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  generateMTU(min: number, max: number): number {
    let mtu: number;

    do {
      mtu = Math.floor(Math.random() * (max - min + 1) + min);
    } while (mtu % 8 !== 0);

    return mtu + 20;
  }

  calculateNumFragments(mtu: number, totalLength: number): number {
    let numFragments = Math.floor(totalLength / mtu);

    if (totalLength % mtu !== 0) {
      numFragments++;
    }

    return numFragments;
  }

  requiresFragmenting(mtu: number, totalLength: number): number {
    if (totalLength > mtu) {
      return 0;
    }
    return 1;
  }

  fragmentInBinary(): void {
    let protocolDec = 0;
    let sourceIPDec = [];
    let destinationIPDec = [];

    this.fragments.forEach((element) => {
      const version = this.convert(element.version, 2, 4);
      const headerLength = this.convert((element.headerLength / 4), 2, 4);
      const differentiatedServices = this.convert(
        element.differentiatedServices,
        2,
        8
      );
      const totalLength = this.convert(element.totalLength, 2, 16);
      const identification = this.convert(element.identification, 2, 16);
      const displacement = this.convert((element.displacement / 8), 2, 13);
      const timeOfLife = this.convert(element.timeOfLife, 2, 8);
      if (element.protocol === 'ICMP') {
        protocolDec = 1;
      } else if (element.protocol === 'TCP') {
        protocolDec = 6;
      } else {
        protocolDec = 17;
      }
      const protocol = this.convert(protocolDec, 2, 8);
      sourceIPDec = element.sourceIP.split('.');
      let sourceIPBin = '';
      for (let i = 0; i < sourceIPDec.length; i++) {
        sourceIPBin += this.convert(Number(sourceIPDec[i]), 2, 8);
      }
      destinationIPDec = element.destinationIP.split('.');
      let destinationIPBin = '';
      for (let i = 0; i < destinationIPDec.length; i++) {
        destinationIPBin += this.convert(Number(destinationIPDec[i]), 2, 8);
      }

      const line0 =
        version + headerLength + differentiatedServices + totalLength;
      const line1 = identification + element.flags + displacement;
      const line2 = timeOfLife + protocol + '0000000000000000';
      const line3 = sourceIPBin;
      const line4 = destinationIPBin;

      const fragmentBin = [line0, line1, line2, line3, line4];
      this.fragmentsBin.push(fragmentBin);
    });
  }

  fragmentInHexa(): void {
    let datagramHexa: string;

    for (let i = 0; i < this.fragmentsBin.length; i++) {
      datagramHexa = '';

      for (let j = 0; j < this.fragmentsBin[i].length; j++) {
        const element = parseInt(this.fragmentsBin[i][j].substring(0, 8), 2);
        const element1 = parseInt(this.fragmentsBin[i][j].substring(8, 16), 2);
        const element2 = parseInt(this.fragmentsBin[i][j].substring(16, 24), 2);
        const element3 = parseInt(this.fragmentsBin[i][j].substring(24), 2);

        const hexa = this.convert(element, 16, 2);
        const hexa1 = this.convert(element1, 16, 2);
        const hexa2 = this.convert(element2, 16, 2);
        const hexa3 = this.convert(element3, 16, 2);

        datagramHexa += hexa + ' ' + hexa1 + ' ' + hexa2 + ' ' + hexa3 + '\n';
      }

      this.checkSum(datagramHexa);
    }
  }

  checkSum(datagramHexa: string): void {
    const datagramAux = datagramHexa.split(' ').join('').split('\n').join('');
    let acum = parseInt(datagramAux.substring(0, 4), 16);
    let current: number;
    let aux: string;
    let aux1: number;

    for (let i = 4; i < 40; i += 4) {
      current = parseInt(datagramAux.substring(i, i + 4), 16);

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

    datagramHexa =
      datagramHexa.substring(0, 30) + aux + datagramHexa.substring(35);

    this.fragmentsHexa.push(datagramHexa);
  }

  loadCheckSumToBinary(): void {
    for (let i = 0; i < this.fragmentsHexa.length; i++) {
      const aux = parseInt(
        this.fragmentsHexa[i].substring(30, 32) +
          this.fragmentsHexa[i].substring(33, 35),
        16
      );

      const aux1 = this.convert(aux, 2, 16);

      this.fragments[i].checksum = aux;

      this.fragmentsBin[i][2] = this.fragmentsBin[i][2].substring(0, 16) + aux1;
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
}
