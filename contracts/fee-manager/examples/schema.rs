use std::env::current_dir;
use std::fs::create_dir_all;

use cosmwasm_schema::{export_schema, remove_schemas, schema_for};

use fee_manager::msg::{ConfigResponse, ConfigUpdate, ExecuteMsg, InstantiateMsg, QueryMsg};
use fee_manager::state::State;

fn main() {
    let mut out_dir = current_dir().unwrap();
    out_dir.push("fee-manager_schema");
    create_dir_all(&out_dir).unwrap();
    remove_schemas(&out_dir).unwrap();

    export_schema(&schema_for!(InstantiateMsg), &out_dir);
    // EXECUTE
    export_schema(&schema_for!(ExecuteMsg), &out_dir);
    export_schema(&schema_for!(ConfigUpdate), &out_dir);
    // QUERY
    export_schema(&schema_for!(QueryMsg), &out_dir);
    export_schema(&schema_for!(ConfigResponse), &out_dir);

    export_schema(&schema_for!(State), &out_dir);
}
