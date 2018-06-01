/c
local out = ""
local tab = 0
function write(...)
  local arg = {...}
  for i, v in ipairs(arg) do
    out = out .. tostring(v)
  end
end

function item_count(node)
  local count = 0
  for k, v in pairs(node) do
    count = count + 1
  end
  return count
end

function writeTab()
  local j = 0
  while j < tab do
    write(' ')
    j = j + 1
  end
end

function newline()
  write("\r\n")
  writeTab()
end

function traverse_table(node)
  write("{")
  tab = tab + 2
  newline()
  local i = 1
  local count = item_count(node)
  for k, v in pairs(node) do
    write("\"", tostring(k), "\": ")
    traverse(v)
    if i < count then
      write(",")
      newline()
    end
    i = i + 1
  end
  tab = tab - 2
  newline()
  write("}\n")
end

function traverse_array(node)
  local count = item_count(node)
  write("[")
  for k, v in ipairs(node) do
    traverse(v)
    if k < count then
      write(",")
    end
  end
  write("]")
end

function traverse(node)
  if type(node) == "table" then
    if type(next(node)) == "number" then
      traverse_array(node)
    else
      traverse_table(node)
    end
  elseif type(node) == "string" then
    write("\"", node, "\"")
  else
    write(node)
  end
end

function inspect_recipe(node)
  return {
    name=node.name,
    enabled=node.enabled,
    category=node.category,
    ingredients=node.ingredients,
    products=node.products,
    hidden=node.hidden,
    energy=node.energy,
    order=node.order,
    group=node.group.name,
    subgroup=node.subgroup.name
  }
end

function inspect_resistances(node)
  return {
    physical=inspect_resistance(node.physical),
    impact=inspect_resistance(node.impact),
    poison=inspect_resistance(node.poison),
    explosion=inspect_resistance(node.explosion),
    fire=inspect_resistance(node.fire),
    laser=inspect_resistance(node.laser),
    acid=inspect_resistance(node.acid),
    electric=inspect_resistance(node.electric)
  }
end

function inspect_resistance(node)
  if node == nil then
    return nil
  end
  return {
    decrease=node.decrease,
    percent=node.percent
  }
end

function inspect_burner_prototype(node)
  if node == nil then
    return nil
  end

  return {
    emissions=node.emissions,
    effectivity=node.effectivity,
    fuel_inventory_size=node.fuel_inventory_size,
    burnt_inventory_size=node.burnt_inventory_size
  }
end

function inspect_electric_energy_source_prototype(node)
  if node == nil then
    return nil
  end

  return {
    buffer_capacity=node.buffer_capacity,
    usage_priority=node.usage_priority,
    input_flow_limit=node.input_flow_limit,
    output_flow_limit=node.output_flow_limit,
    drain=node.drain,
    emissions=node.emissions
  }
end


function inspect_entity(node)
  if node.type == "decorative" then return nil end
  if node.type == "corpse" then return nil end
  if node.type == "smoke" then return nil end
  if node.type == "smoke-with-trigger" then return nil end
  if node.group == "environment" then return nil end
  if node.subgroup == "grass" then return nil end
  if node.subgroup == "trees" then return nil end
  if node.subgroup == "remnant" then return nil end

  return {
    name=node.name,
    type=node.type,
    flags=node.flags,

    max_health=node.max_health,

    resistances=inspect_resistances(node.resistances)

    order=node.order,
    group=node.group.name,
    subgroup=node.subgroup.name,

    crafting_speed=node.crafting_speed,
    crafting_categories=node.crafting_categories,
    resource_categories=node.resource_categories,

    belt_speed=node.belt_speed,
    max_underground_distance=node.max_underground_distance,

    inventory_size=node.get_inventory_size(1),

    mining_speed=node.mining_speed,
    mining_power=node.mining_power,
    
    energy_usage=node.energy_usage,
    max_energy_usage=node.max_energy_usage,
    braking_force=node.braking_force,
    max_payload_size=node.max_payload_size,
    max_energy=node.max_energy,

    burner_prototype=inspect_burner_prototype(node.burner_prototype),
    electric_energy_source_prototype=inspect_electric_energy_source_prototype(node.electric_energy_source_prototype),

    maximum_temperature=node.maximum_temperature,
    target_temperature=node.target_temperature,

    fluid_usage_per_tick=node.fluid_usage_per_tick,
    fluid=node.fluid,
    fluid_capacity=node.fluid_capacity,
    pumping_speed=node.pumping_speed,

    production=node.production
  }
end

function inspect_item(node)
  local result = {
    name=node.name,
    type=node.type,
    flags=node.flags,
    fuel_category=node.fuel_category,
    stack_size=node.stack_size,
    group=node.group.name,
    subgroup=node.subgroup.name,
    inventory_size=node.inventory_size,
    order=node.order
  }

  if node.fuel_value > 0 then
    result.fuel_value = node.fuel_value
    result.fuel_acceleration_multiplier = node.fuel_acceleration_multiplier
    result.fuel_top_speed_multiplier = node.fuel_top_speed_multiplier
  end

  if (node.place_result) then
    result.place_result = node.place_result.name
  end

  return result;
end


function inspect_all(table, fn)
  local r = {}
  local result
  for k, v in pairs(table) do
    result = fn(v)
    if result ~= nil then
      r[k] = result
    end
  end
  traverse(r)
end


write("{");

write('"items": ')
tab = tab + 1
inspect_all(game.item_prototypes, inspect_item)
tab = tab - 1

write(",")

write('"recipes": ')
tab = tab + 1
inspect_all(game.recipe_prototypes, inspect_recipe)
tab = tab - 1

write(",")

write('"entities": ')
tab = tab + 1
inspect_all(game.entity_prototypes, inspect_entity)
tab = tab - 1

write("}");

game.write_file("data.json", out)
