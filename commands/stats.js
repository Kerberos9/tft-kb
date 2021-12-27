const { TftApi, Constants } = require('twisted');
const {
    Client,
    Intents,
    MessageEmbed,
    MessageAttachment
} = require('discord.js');
const itemsData = require('./items.json');
const ChartJsImage = require('chartjs-to-image');
require('dotenv').config();
async function getUserStats(msg, username, regionSlug) {
    const api = new TftApi();

    try {
        msg.react('✅');
        const region = getRegionBySlug(regionSlug);
        console.log(region);
        if (region === 'error')
            return regionNotFoundResponse(msg, username, regionSlug);
        const {
            response: { puuid, id }
        } = await api.Summoner.getByName(username, region);

        let games = await api.Match.listWithDetails(
            puuid,
            getRegionGroupBySlug(regionSlug),
            { count: process.env.PREFIX === 't!' ? 5 : 20 }
        );
        console.log(games);
        games = games.filter(
            g => g.info.tft_set_number === 6 && g.info.queue_id === 1100
        );

        if (games.length === 0) return userHasNoGamesResponse(msg, username);
        let rank = (await api.League.get(id, region)).response.filter(
            q => q.queueType === 'RANKED_TFT'
        );

        if (rank) {
            console.log(rank[0]);
            rank = rank[0];
            tier = rank.tier.toLowerCase();
            tier =
                tier[0].toUpperCase() +
                tier.slice(1) +
                ` ${rank.rank} ${rank.leaguePoints} LP ${
                    rank.hotStreak ? ':fire::fire::fire:' : ''
                }`;
        } else {
            tier = 'Not ranked yet';
        }
        games = games.reverse();
        let traits = {};
        let units = {};
        let items = {};
        let placements = [];
        let gold = [];
        let levels = [];
        let rounds = [];
        let damageToPlayers = [];
        let cost = [];
        let totalCost = [];
        games.forEach(game => {
            let stats = game.info.participants.filter(
                g => g.puuid === puuid
            )[0];
            placements.push(stats.placement);
            stats.traits.forEach(t => {
                traits[t.name] = (traits[t.name] || 0) + t.tier_current;
            });
            let totalUnitCost = 0;
            stats.units.forEach(u => {
                u.items.forEach(i => (items[i] = (items[i] || 0) + 1));
                units[u.character_id] = (units[u.character_id] || 0) + 1;
                cost.push(u.rarity + 1);
                totalUnitCost += u.rarity + 1;
            });
            levels.push(stats.level);
            gold.push(stats.gold_left);
            rounds.push(stats.last_round);
            damageToPlayers.push(stats.total_damage_to_players);
            totalCost.push(totalUnitCost);
        });
        let placementsAverage = getAverage(placements).toFixed(2);
        let goldAverage = getAverage(gold).toFixed(2);
        let levelsAverage = getAverage(levels).toFixed(2);
        let roundsAverage = getAverage(rounds).toFixed(2);
        let damageToPlayersAverage = getAverage(damageToPlayers).toFixed(2);
        let costAverage = getAverage(cost).toFixed(2);
        let totalCostAverage = getAverage(totalCost).toFixed(2);

        const placementsGraph = await new ChartJsImage()
            .setConfig({
                type: 'line',
                data: {
                    labels: placements,
                    datasets: [
                        {
                            label: 'Placements',
                            data: placements,
                            fill: false,
                            lineTension: 0.1
                        }
                    ]
                },
                options: {
                    layout: {
                        padding: {
                            left: 5,
                            right: 10,
                            top: 0,
                            bottom: 20
                        }
                    },
                    title: {
                        display: true,
                        text: `Last ${games.length} games`,
                        fontSize: 20
                    },
                    legend: {
                        display: false
                    },
                    scales: {
                        yAxes: [
                            {
                                ticks: {
                                    min: 1,
                                    max: 8,
                                    stepSize: 1,
                                    reverse: true,
                                    display: false
                                },
                                gridLines: {
                                    display: false
                                }
                            }
                        ],
                        xAxes: [
                            {
                                display: false
                            }
                        ]
                    },
                    plugins: {
                        datalabels: {
                            display: true,
                            align: 'bottom',
                            borderRadius: 10,
                            backgroundColor: 'white',
                            fontSize: 'bold'
                        }
                    }
                }
            })
            .setWidth(400)
            .setHeight(200)
            .setBackgroundColor('white')
            .toDataUrl();

        let graphImage = attachGraphImage(placementsGraph);

        traits = sortTraits(traits);
        units = sortUnits(units);
        items = sortItems(items);

        const embed = new MessageEmbed()
            .setTitle(
                `${
                    process.env.PREFIX === 'tft!' ? '' : '**TEST** '
                }TFT Stats for ${username}`
            )
            .setImage('attachment://chart.jpeg')
            .setFooter(
                'https://github.com/Kerberos9/tft-kb',
                'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
            )

            .setColor(11167487)
            .addFields([
                {
                    name: '**Most Used Traits**',
                    value: `→1. ${Object.keys(traits)[0]}   
            →2. ${Object.keys(traits)[1]}
            →3. ${Object.keys(traits)[2]}`,
                    inline: true
                },
                {
                    name: '**Most Used Units**',
                    value: `→1. ${Object.keys(units)[0]}   
            →2. ${Object.keys(units)[1]}
            →3. ${Object.keys(units)[2]}`,
                    inline: true
                },
                {
                    name: '**Most Used Items**',
                    value: `→1. ${Object.keys(items)[0]}   
            →2. ${Object.keys(items)[1]}
            →3. ${Object.keys(items)[2]}`,
                    inline: true
                },
                {
                    name: '**Average End Level**',
                    value: `${levelsAverage}`,
                    inline: true
                },
                {
                    name: '**Average End Gold**',
                    value: `${goldAverage}`,
                    inline: true
                },
                {
                    name: '**Average End Round**',
                    value: `${roundsAverage}`,
                    inline: true
                },
                {
                    name: '**Average Unit Cost**',
                    value: `${costAverage}`,
                    inline: true
                },
                {
                    name: '**Average Board Cost**',
                    value: `${totalCostAverage}`,
                    inline: true
                },
                {
                    name: '**Average Damage to Players**',
                    value: `${damageToPlayersAverage}`,
                    inline: true
                },
                {
                    name: '**Rank**',
                    value: tier,
                    inline: true
                },
                {
                    name: '**Average Placement**',
                    value: `${placementsAverage} ${
                        placementsAverage >= 4.5
                            ? '<:Sadge:825386882603024395>'
                            : '<:Pog:648630351874359298>'
                    }`,
                    inline: false
                }
            ]);

        let message = await msg.channel.send({
            embeds: [embed],
            files: [graphImage]
        });
    } catch (e) {
        if (e.status === 404) {
            return userNotFoundResponse(msg, username, regionSlug);
        } else if (e.status === 429) {
            return rateLimitResponse(msg, username);
        } else {
            return unknownErrorResponse(msg, username, e);
        }
    }
}

function sortTraits(traits) {
    var sortable = [];
    for (var trait in traits) {
        sortable.push([trait, traits[trait]]);
    }

    sortable.sort((a, b) => b[1] - a[1]);
    var objSorted = {};
    sortable.forEach(item => {
        objSorted[item[0].substr(5)] = item[1];
    });
    return objSorted;
}

function sortItems(items) {
    var sortable = [];
    for (var item in items) {
        sortable.push([item, items[item]]);
    }

    sortable.sort((a, b) => b[1] - a[1]);
    var objSorted = {};
    sortable.forEach(item => {
        let itemData = itemsData.items
            .filter(i => i.id === Number.parseInt(item[0]))
            .at(-1);
        objSorted[itemData.name] = item[1];
    });
    return objSorted;
}

function sortUnits(units) {
    var sortable = [];
    for (var unit in units) {
        sortable.push([unit, units[unit]]);
    }

    sortable.sort((a, b) => b[1] - a[1]);
    var objSorted = {};
    sortable.forEach(item => {
        objSorted[item[0].substr(5)] = item[1];
    });
    return objSorted;
}

function attachGraphImage(imgUrl) {
    const data = imgUrl.split(',')[1];
    const buf = new Buffer.from(data, 'base64');
    const file = new MessageAttachment(buf, 'chart.jpeg');

    return file;
}

async function userNotFoundResponse(msg, username, regionSlug) {
    sendErrorMessage(
        msg,
        `User ${username} not found in region ${regionSlug}.`
    );
}

async function regionNotFoundResponse(msg, username, regionSlug) {
    sendErrorMessage(
        msg,
        `Invalid region _${regionSlug}_. Valid regions: euw|eune|tr|na|br|jp|lan|las|oce|ru.`
    );
}
async function userHasNoGamesResponse(msg, username) {
    sendErrorMessage(
        msg,
        `User ${username} has no games in the current TFT set.`
    );
}

async function rateLimitResponse(msg, username) {
    sendErrorMessage(msg, `Too many requests, wait a bit.`);
}

async function unknownErrorResponse(msg, username, error) {
    console.error(error);
    sendErrorMessage(msg, `Unknown error`);
}

function getRegionBySlug(slug) {
    switch (slug) {
        case 'euw':
            return Constants.Regions.EU_WEST;
        case 'tr':
            return Constants.Regions.TURKEY;
        case 'eune':
            return Constants.Regions.EU_EAST;
        case 'na':
            return Constants.Regions.AMERICA_NORTH;
        case 'br':
            return Constants.Regions.BRAZIL;
        case 'jp':
            return Constants.Regions.JAPAN;
        case 'lan':
            return Constants.Regions.LAT_NORTH;
        case 'las':
            return Constants.Regions.LAT_SOUTH;
        case 'oce':
            return Constants.Regions.OCEANIA;
        case 'ru':
            return Constants.Regions.RUSSIA;
        case 'kr':
            return Constants.Regions.KOREA;
        default:
            return 'error';
    }
}
function getRegionGroupBySlug(regionSlug) {
    switch (regionSlug) {
        case 'euw':
        case 'ru':
        case 'eune':
        case 'tr':
            return Constants.RegionGroups.EUROPE;
        case 'jp':
        case 'kr':
            return Constants.RegionGroups.ASIA;
        case 'na':
        case 'br':
        case 'lan':
        case 'las':
        case 'oce':
            return Constants.RegionGroups.AMERICAS;
        default:
            return 'error';
    }
}
async function sendErrorMessage(msg, message) {
    await msg.react('❌');
    const embed = new MessageEmbed().setTitle(message);
    await msg.channel.send({
        embeds: [embed]
    });
}
getAverage = data => data.reduce((a, b) => a + b, 0) / data.length;
module.exports = getUserStats;
