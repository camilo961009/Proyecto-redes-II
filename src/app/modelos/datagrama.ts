export interface Datagrama {

    index: number;
    version: number;
    longitudEncabezado: number;
    serviciosDiferenciados: number;
    longitudTotal: number;
    identificacion: number;
    flags: string;
    desplazamineto: number;
    tiempoDeVida: number;
    protocolo: string;
    sumaDeComprobacion: number;
    ipOrigen: string;
    ipDestino: string;

}
