const { TftApi, Constants } = require('twisted');
const {
    Client,
    Intents,
    MessageEmbed,
    MessageAttachment
} = require('discord.js');
const ChartJsImage = require('chartjs-to-image');
require('dotenv').config();
async function getUserStats(msg, username) {
    const api = new TftApi();
    const {
        response: { puuid }
    } = await api.Summoner.getByName(username, Constants.Regions.EU_WEST);
    let games = await api.Match.listWithDetails(
        puuid,
        Constants.RegionGroups.EUROPE
    );
    games = games.filter(g => g.info.tft_set_number === 6);

    let traits = {
        Set6_Academy: 0,
        Set6_Arcanist: 0,
        Set6_Chemtech: 0,
        Set6_Cuddly: 0,
        Set6_Enchanter: 0,
        Set6_Imperial: 0,
        Set6_Mutant: 0,
        Set6_Scholar: 0,
        Set6_Scrap: 0,
        Set6_Socialite: 0,
        Set6_Yordle: 0,
        Set6_Assassin: 0,
        Set6_Bodyguard: 0,
        Set6_Bruiser: 0,
        Set6_Enforcer: 0,
        Set6_Glutton: 0,
        Set6_Mercenary: 0,
        Set6_Protector: 0,
        Set6_Sister: 0,
        Set6_Syndicate: 0,
        Set6_Twinshot: 0,
        Set6_Challenger: 0,
        Set6_Clockwork: 0,
        Set6_Innovator: 0,
        Set6_Transformer: 0,
        Set6_Sniper: 0,
        Set6_Colossus: 0
    };

    let placements = [];
    let gold = [];
    let levels = [];
    let rounds = [];
    let damageToPlayers = [];
    games.forEach(game => {
        let stats = game.info.participants.filter(g => g.puuid === puuid)[0];
        placements.push(stats.placement);
        stats.traits.forEach(t => {
            traits[t.name]++;
        });
        levels.push(stats.level);
        gold.push(stats.gold_left);
        rounds.push(stats.last_round);
        damageToPlayers.push(stats.total_damage_to_players);
    });
    let placementsAverage = getAverage(placements);
    let goldAverage = getAverage(gold);
    let levelsAverage = getAverage(levels);
    let roundsAverage = getAverage(rounds);
    let damageToPlayersAverage = getAverage(damageToPlayers);
    // Placements graph
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
                    text: 'Last 20 games',
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
    // Sort most used traits
    traits = sortTraits(traits);

    const embed = new MessageEmbed()
        .setTitle(`TFT Stats for ${username}`)
        .setImage(placementsGraph)
        .setImage('attachment://chart.jpeg')
        .setColor(11167487)
        .addFields([
            {
                name: '**Best Traits**',
                value: `→1. ${Object.keys(traits)[0]}   
            →2. ${Object.keys(traits)[1]}
            →3. ${Object.keys(traits)[2]}`,
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
                name: '**Average Damage to Players**',
                value: `${damageToPlayersAverage}`,
                inline: true
            },
            {
                name: '**Average Placement**',
                value: `${placementsAverage} ${
                    placementsAverage > 4
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
    //message.react('<:Pog:648630351874359298>');
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

function attachGraphImage(imgUrl) {
    const data = imgUrl.split(',')[1];
    const buf = new Buffer.from(data, 'base64');
    const file = new MessageAttachment(buf, 'chart.jpeg');

    return file;
}

getAverage = data => data.reduce((a, b) => a + b, 0) / data.length;
module.exports = getUserStats;
