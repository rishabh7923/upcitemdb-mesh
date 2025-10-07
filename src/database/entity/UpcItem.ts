import { Entity, PrimaryColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn } from "typeorm"

@Entity("upc_items")
export class UpcItem extends BaseEntity {
    @PrimaryColumn({ type: "varchar", length: 20 })
    upc!: string

    @Column({ type: "varchar", length: 20, unique: true })
    ean!: string

    @Column({ type: "text" })
    title!: string

    @Column({ type: "varchar", length: 50, nullable: true })
    gtin?: string

    @Column({ type: "varchar", length: 20, nullable: true })
    asin?: string

    @Column({ type: "text", nullable: true })
    description?: string

    @Column({ type: "varchar", length: 100, nullable: true })
    brand?: string

    @Column({ type: "varchar", length: 100, nullable: true })
    model?: string

    @Column({ type: "varchar", length: 100, nullable: true })
    dimension?: string

    @Column({ type: "varchar", length: 50, nullable: true })
    weight?: string

    @Column({ type: "text", nullable: true })
    category?: string

    @Column({ type: "varchar", length: 10, nullable: true })
    currency?: string

    @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
    lowest_recorded_price?: number

    @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
    highest_recorded_price?: number

    @Column({ type: "json", nullable: true })
    images?: string[]

    @Column({ type: "json", nullable: true })
    offers?: UpcItemOffer[]

    @CreateDateColumn()
    created_at!: Date

    @UpdateDateColumn()
    updated_at!: Date
}

export interface UpcItemOffer {
    merchant: string
    domain: string
    title: string
    currency: string
    list_price: number
    price: number
    shipping: string
    condition: string
    availability: string
    link: string
    updated_t: number
}