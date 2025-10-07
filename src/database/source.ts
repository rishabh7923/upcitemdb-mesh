import { DataSource } from "typeorm"
import { UpcItem } from "./entity/UPCItem"

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: "upc_data.db",
    entities: [UpcItem],
    synchronize: true,
    logging: false
})