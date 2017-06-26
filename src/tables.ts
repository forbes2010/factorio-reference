import  {
    basicTable, staticTable, doubleRowHeaderTable,
    Displayable,
    fixed, item, itemCount, large, g, p, nOf, text, ratio, itemGroup, integer, long_time, short_time, time, ceil, floor, toElement,
    Belts, BeltLanes, Fuels, Boxes, Assemblers
} from './setup';

import { recipes } from './recipes';
import { items } from './items';

/******* Belts ***********/
doubleRowHeaderTable({
    table: 'belt-throughput',
    origin1: text("Interval"),
    origin2: text("Belt"),
    rows1: [text("per second"), text("per minute")], 
    rows2: Belts,
    cols: ["One Lane", "Both Lanes"],
    cell(r1, r2, c, ri1, ri2, ci) {
        if (ri1 === 0) {
            return fixed(r2.throughput / (2 - ci));
        } else {
            return integer(r2.throughput / (2 - ci) * (ri1 === 0 ? 1 : 60));
        }
    }
});

// TODO: Only run even numbers; go up to 16; include closed form
// https://www.reddit.com/r/factorio/comments/67xgge/nuclear_ratios/
staticTable("nuclear", [
    [item("nuclear-reactor"), item("offshore-pump"), item("heat-exchanger"), item("steam-turbine"), text("Power (MW)")],
    [1, 1, 4, 7, 40],
    [2, 2, 16, 28, 160],
    [4, 5, 48, 83, 580],
    [6, 7, 80, 138, 800],
    [8, 10, 112, 193, 1120]
    // TODO: Include closed-form for last row
]);

// TODO: Figure out a closed-form mathy way to do this
// e.g. http://www.wolframalpha.com/input/?i=odds+of+40+or+more+successes+in+8000+trials+p%3D0.007
staticTable("kovarex", [
    [item("uranium-ore"), itemCount("uranium-235", 40)],
    [large(40000), g(2, "%")],
    [large(45000), g(8, "%")],
    [large(50000), g(22, "%")],
    [large(55000), g(43, "%")],
    [large(60000), g(64, "%")],
    [large(65000), g(81, "%")],
    [large(70000), g(92, "%")],
    [large(75000), g(97, "%")],
    [large(80000), g(99, "%")]
]);



basicTable({
    table: "nuclear-runtime",
    origin: item("uranium-ore"),
    rows: [10, 25, 50, 100, 250, 500, 1000, 1500].map(n => n * 1000),
    rowHeader: n => large(n),
    cols: [1, 2, 4, 8, 12, 20],
    colHeader: n =>  itemCount("nuclear-reactor", n),
    cell: (patchSize, nReactors) => {
        const fuelCells = 630 / 10000 * patchSize;
        const reactorSeconds = fuelCells * 200;
        const seconds = reactorSeconds / nReactors;
        return long_time(seconds);
    }
});

/******* Mining ***********/
//  Regular ores come out at 0.525/s, stone at 0.65/s
//  Steel / electric furnaces are twice as fast
//  Iron/copper plate smelts at 1 ore / 3.5s
//  
//  Stone brick smelts 2 ore / 3.5s
//  Steel / electric furnaces are twice as fast
staticTable("minersPerFurnace", [
    [text("Output"), item("stone-furnace"), itemGroup("steel-furnace", "electric-furnace")],
    [itemGroup("iron-plate", "copper-plate"),
    ratio(itemCount("electric-mining-drill", 6), itemCount("stone-furnace", 11)),
    ratio(itemCount("electric-mining-drill", 12), itemCount("steel-furnace", 11))],

    [item("stone-brick"),
    ratio(itemCount("electric-mining-drill", 7), itemCount("stone-furnace", 8)),
    ratio(itemCount("electric-mining-drill", 7), itemCount("steel-furnace", 4))],
]);

function groupBy<T, K>(items: T[], keyFunc: (x: T) => K): { key: K; items: T[] }[] {
    const outputs: { key: K; items: T[] }[] = [];
    for(const item of items) {
        const key = keyFunc(item);
        let group: { key: K; items: T[] } | undefined = undefined;
        for(const g of outputs) {
            if (g.key === key) {
                group = g;
                break;
            }
        }
        if (group === undefined) {
            outputs.push({ key, items: [item]});
        } else {
            group.items.push(item);
        }
    }
    return outputs;
}

/******* Assemblers and Belts ***********/
const interestingRecipes: string[] = [
    "transport-belt", "fast-transport-belt", "express-transport-belt",
    "inserter",
    "rail", "assembling-machine-1", "assembling-machine-2",
    "electronic-circuit", "processing-unit", "advanced-circuit",
    "rocket-fuel", "low-density-structure", "rocket-control-unit"
];
const recipeList = Object.keys(recipes).map(k => recipes[k]).filter(r => interestingRecipes.indexOf(r.name) >= 0);
recipeList.sort((a, b) => interestingRecipes.indexOf(a.name) - interestingRecipes.indexOf(b.name));
const recipeGroups = groupBy(recipeList, r => r.energy);
recipeGroups.sort((a, b) => a.key - b.key);
doubleRowHeaderTable({
    table: "crafting",
    origin1: "Recipe / Speed",
    origin2: "Belt",
    cell: (r1, r2, c) => {
        return Math.ceil(r2.throughput * (r1.key / c.speed));
    },
    cols: Assemblers,
    rows1: recipeGroups,
    rows2: Belts,
    row1Header: r => g(p(r.key + 's'), itemGroup(...r.items.map(i => i.name))),
    row2Header: r => item(r.name)
});

/******* Steam Power ***********/
staticTable("steam", [
    [item("offshore-pump"), item("boiler"), item("steam-engine"), item("electric-mining-drill"), text("Power")],
    [integer(1), integer(20), integer(40), integer(18), fixed(40 * 0.900, "MW")]
]);

// Boilers consume 1.8 MW and there are 20 of them per setup
const wattsConsumedPerSetup = 1800 * 20;
basicTable({
    origin: text(''),
    table: "steam-advanced",
    cell: (fuel, belt) => {
        const wattsProvided = fuel.energy * belt.throughput;
        return fixed(wattsProvided / wattsConsumedPerSetup);
    },
    cols: Belts,
    rows: Fuels
});

const itemList: Array<[string, string[]]> = [
    ["Ores", ["iron-ore", "copper-ore", "coal", "stone", "uranium-ore"]],
    ["Smelted", ["iron-plate", "steel-plate", "copper-plate", "stone-brick", "uranium-235", "uranium-238"]],
    ["Intermediates", ["copper-cable", "electronic-circuit", "advanced-circuit", "battery", "science-pack-1", "processing-unit", "plastic-bar", "iron-gear-wheel"]],
    ["Logistics", ["transport-belt", "pipe", "rail", "repair-pack", "stone-wall", "splitter", "pipe-to-ground", "rail-signal", "rail-chain-signal", "train-stop"]],
    ["Power", ["small-electric-pole", "medium-electric-pole", "big-electric-pole", "substation", "solar-panel", "accumulator", "small-lamp"]],
    ["Trains", ["locomotive", "cargo-wagon", "fluid-wagon"]],
    ["Tiles", ["concrete", "hazard-concrete", "landfill"]],
    ["Ammo", ["piercing-rounds-magazine", "shotgun-shell", "cannon-shell", "explosive-rocket"]],
    ["Other Weapons", ["grenade", "cluster-grenade", "atomic-bomb", "land-mine"]],
    ["Rocket Parts", ["low-density-structure", "rocket-control-unit", "rocket-fuel", "satellite"]],
    ["Space", ["space-science-pack"]]
];

function makeStackSizeTable(): Displayable[][] {
    const result: Displayable[][] = [];
    result.push(["Category", "Items", "Size"]);

    for(let i = 0; i < itemList.length; i++) {
        let sizes: number[] = [];
        let outputs: string[][] = [];
        for (let j = 0; j < itemList[i][1].length; j++) {
            let size = items[itemList[i][1][j]].stack_size;
            let idx = sizes.indexOf(size);
            if (idx < 0) {
                idx = sizes.push(size) - 1;
                outputs.push([]);
            }
            outputs[idx].push(itemList[i][1][j]);
        }
        for(let j = 0; j < sizes.length; j++) {
            result.push([itemList[i][0], itemGroup(...outputs[j]), sizes[j]]);
        }
    }
    return result;
}

/******* Stack sizes ***********/
staticTable("stack-sizes", makeStackSizeTable());

/******* Storage ***********/
const goodNumbers = [1, 2, 4, 8, 16, 32, 64, 128, undefined];
basicTable({
    origin: text("#"),
    table: "storage",
    cols: Boxes,
    rows: goodNumbers,
    rowHeader: c => c === undefined ? text("(slots)") : toElement(c),
    cell: (row, col) => {
        if (row === undefined) {
            return integer(col.size);
        }
        return large(row * col.size * 100);
    }
});


const baseLiqRatio = [
    1/3, // Pump
    50, // Coal to refineries
    25, // Refineries
    3, // Heavy crack
    9, // Light crack
    8.75, // Coal to chem plants
    7, // Coal plants
    17.5 // Plastic output
]
/******* Pure coal to Plastic ***********/
// https://docs.google.com/spreadsheets/d/1VzSvviSJdFffIQPJJCHYEy11BlT36NWPieb_yaEcnGk/edit?usp=sharing
basicTable({
    table: "coal-to-plastic",
    noRowHeader: true,
    rows: [1 / 3, 1, 2, 3, 4, 5],
    cols: [item("offshore-pump"),
        item("coal"),
        item("oil-refinery"),
        item("heavy-oil-cracking"),
        item("light-oil-cracking"),
        item("coal"),
        item("chemical-plant"),
        item("plastic-bar")],
    cell: (r, c, ri, ci) => {
        if (ci === baseLiqRatio.length - 1) {
            return fixed(r * baseLiqRatio[ci]);
        } else {
            return ceil(r * baseLiqRatio[ci]);
        }
    }
});

const baseAdvancedToFuelRatio = [
    1, // Water (actual value: 28.75, TBD)
    50, // Oil consumed
    25, // Refineries (advanced)
    5, // Heavy Cracking
    63, // Light to fuel,
    33, // Gas to fuel
    40 // Output
];
basicTable({
    table: "advanced-oil-to-fuel",
    rows: [1/25, 5 / 25, 10 / 25, 15 / 25, 20 / 25, 1],
    cols: [item("offshore-pump"), item("crude-oil"), item("oil-refinery"), item("heavy-oil-cracking"), item("solid-fuel-from-light-oil"), item("solid-fuel-from-petroleum-gas"), item("solid-fuel")],
    noRowHeader: true,
    cell: (r, c, ri, ci) => {
        return ceil(r * baseAdvancedToFuelRatio[ci]);
    }
});

const baseBasicToFuelRatio = [
    25, // Refineries (basic)
    50, // Oil consumed
    18, // Heavy to fuel
    36, // Light to Fuel
    24, // Gas to fuel
    32.5 // Output
];
basicTable({
    table: "basic-oil-to-fuel",
    rows: [1/25, 6 / 25, 10 / 25, 15 / 25, 20 / 25, 1, 31 / 25],
    cols: [item("oil-refinery"), item("crude-oil"), item("solid-fuel-from-heavy-oil"), item("solid-fuel-from-light-oil"), item("solid-fuel-from-petroleum-gas"), item("solid-fuel")],
    noRowHeader: true,
    cell: (r, c, ri, ci) => {
        if (ci === 5) {
            return fixed(r * baseBasicToFuelRatio[ci])
        } else {
            return ceil(r * baseBasicToFuelRatio[ci])
        }
    }
});

const baseOilToGasRatio = [
    0.1, // Pumps
    5, // Refineries
    1, // Heavy cracking,
    7, // Light cracking
    90, // Gas/s
];
basicTable({
    table: "oil-to-gas",
    rows: [1, 2, 3, 4, 5, 10, 15, 20],
    cols: [item("offshore-pump"), item("oil-refinery"), item("heavy-oil-cracking"), item("light-oil-cracking"), item("petroleum-gas")],
    noRowHeader: true,
    cell: (r, c, ri, ci) => {
        return ceil(r * baseOilToGasRatio[ci]);
    }
});

namespace TrainLoadTime {
    // Basic, Fast, Stack (chest-to-chest)
    const speeds = [2.5, 6.93, 27.7];
    const reps = ["iron-ore", "iron-plate", "electronic-circuit"];
    const sizes = [50, 100, 200];
    doubleRowHeaderTable({
        origin1: 'Stack Size',
        origin2: '# of inserters',
        table: "train-load-time",
        cols: [item("inserter"), item("fast-inserter"), item("stack-inserter")],
        rows1: [50, 100, 200],
        rows2: [1, 4, 6, 8, 12],
        row1Header: (r, ri) => itemCount(reps[ri], sizes[ri]),
        cell: (r1, r2, c, ri1, ri2, ci) => {
            return short_time(r1 * 40 / (speeds[ci] * (ri2 + 1)));
        }

    });
}

namespace TrainsNeeded {
    // Dwell time is time spent at station
    // Travel time is time in transit
    
}

// TODO Smelting: A [C] belt of X fuel can power Y [steel, stone] furnaces
// Steel furnace 180kW (craft speed 2)
// Stone furnace 180kW (craft speed 1)
// Craft times: 3.5 (iron, copper, stone), 17.5 (steel)

basicTable({
    table: "smelting-fuel",
    origin: item("steel-furnace"),
    rows: BeltLanes,
    cols: Fuels,
    cell: (r, c) => {
        return floor(r.throughput * c.energy / 180);
    }
});

namespace SmeltingFuelRatios {
    const costs = [3.5, 17.5];
    const speeds = [1, 2];
    const wattage = 180;
    doubleRowHeaderTable({
        table: "smelting-fuel-ratios",
        origin1: "Input",
        origin2: "Furnace",
        rows1: [itemGroup("copper-ore", "iron-ore", "stone"), itemGroup("iron-plate")],
        rows2: ["stone-furnace", "steel-furnace"],
        row2Header: item,
        cols: Fuels,
        cell: (r1, r2, c, ri1, ri2, ci) => {
            return fixed(c.energy / (costs[ri1] / speeds[ri2] * wattage));
        }
    });
}
