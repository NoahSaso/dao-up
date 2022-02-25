use std::env::current_dir;
use std::fs::create_dir_all;

use cosmwasm_schema::{export_schema, remove_schemas, schema_for};

use cw20_dao_crowdfund::msg::DumpStateResponse;
use cw20_dao_crowdfund::msg::{ExecuteMsg, InstantiateMsg, QueryMsg};
use cw20_dao_crowdfund::state::Campaign;
use cw20_dao_crowdfund::state::State;

fn main() {
    let mut out_dir = current_dir().unwrap();
    out_dir.push("schema");
    create_dir_all(&out_dir).unwrap();
    remove_schemas(&out_dir).unwrap();

    export_schema(&schema_for!(InstantiateMsg), &out_dir);
    export_schema(&schema_for!(ExecuteMsg), &out_dir);
    export_schema(&schema_for!(QueryMsg), &out_dir);
    export_schema(&schema_for!(State), &out_dir);
    export_schema(&schema_for!(DumpStateResponse), &out_dir);
    export_schema(&schema_for!(Campaign), &out_dir);
}
