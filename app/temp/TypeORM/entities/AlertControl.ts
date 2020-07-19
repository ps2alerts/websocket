import {Entity, Column, OneToOne} from 'typeorm';
import {JoinColumn} from 'typeorm/browser';
import {Alert} from './Alert';

@Entity()
export class AlertControl {

    @OneToOne(
        (type) => Alert,
        (alert) => alert.id,
    )
    @JoinColumn()
    alert: Alert;

    @Column()
    controlVs: number;

    @Column()
    controlNc: number;

    @Column()
    controlTr: number;

    @Column()
    controlCutoff: number;
}