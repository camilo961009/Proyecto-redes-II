export interface Datagram {

    index: number;
    version: number;
    headerLength: number;
    differentiatedServices: number;
    totalLength: number;
    identification: number;
    flags: string;
    displacement: number;
    timeOfLife: number;
    protocol: string;
    checksum: number;
    sourceIP: string;
    destinationIP: string;

}
