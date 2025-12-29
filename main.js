function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const $ = (sel) => document.querySelector(sel);
    const state = { itemPng: null, editingIndex: null, totems: [] };

    const EFFECTS_LIST = [
      "regeneration","strength","speed","resistance","absorption",
      "fire_resistance","jump_boost","night_vision","invisibility","water_breathing","saturation"
    ];

    const effectsListEl = $('#effectsList');

    function createEffectItem(effect="regeneration", duration=10, amplifier=1) {
      const div = document.createElement('div');
      div.className = "grid md:grid-cols-4 gap-2 items-center";

      const select = document.createElement('select');
      select.className = "px-2 py-1 rounded-xl bg-slate-800 border border-slate-700 text-sm";
      EFFECTS_LIST.forEach(eff => {
        const opt = document.createElement('option');
        opt.value = eff;
        opt.textContent = eff;
        if(eff===effect) opt.selected = true;
        select.appendChild(opt);
      });

      const durationInput = document.createElement('input');
      durationInput.type = "number";
      durationInput.value = duration;
      durationInput.min = 1;
      durationInput.className = "px-2 py-1 rounded-xl bg-slate-800 border border-slate-700 text-sm";

      const amplifierInput = document.createElement('input');
      amplifierInput.type = "number";
      amplifierInput.value = amplifier;
      amplifierInput.min = 1;
      amplifierInput.className = "px-2 py-1 rounded-xl bg-slate-800 border border-slate-700 text-sm";

      const removeBtn = document.createElement('button');
      removeBtn.textContent = "Eliminar";
      removeBtn.className = "px-2 py-1 rounded-xl bg-red-600 hover:bg-red-500 text-sm";
      removeBtn.addEventListener('click', () => div.remove());

      div.append(select, durationInput, amplifierInput, removeBtn);
      effectsListEl.appendChild(div);
    }

    $('#addEffect').addEventListener('click', () => createEffectItem());
    createEffectItem();

    // Imagen
    function wireDropzone(box, input, preview) {
      const setPreview = (file) => {
        state.itemPng = file;
        if (file) {
          preview.src = URL.createObjectURL(file);
          preview.classList.remove('hidden');
        } else {
          preview.classList.add('hidden');
        }
      };
      box.addEventListener('drop', e => {
        e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f && f.type === 'image/png') setPreview(f);
      });
      box.addEventListener('dragover', e => e.preventDefault());
      input.addEventListener('change', e => {
        const f = e.target.files?.[0]; if (f && f.type === 'image/png') setPreview(f);
      });
    }
    wireDropzone($('#itemDrop'), $('#itemInput'), $('#itemPreview'));

    // Guardar tótem
    $('#btnSaveTotem').addEventListener('click', () => {
      const name = $('#namespace').value.trim();
      const id = $('#totemId').value.trim();
      const commands = $('#commandsInput').value.trim();

      if (!name || !id || !state.itemPng) {
        alert('Falta completar nombre, ID o imagen.');
        return;
      }

      const effects = Array.from(effectsListEl.children).map(div => ({
        effect: div.children[0].value,
        duration: div.children[1].value,
        amplifier: div.children[2].value
      }));

      const newTotem = {
  name,
  id,
  commands,
  effects,
  imgFile: state.itemPng, // 👈 archivo real
  imgURL: URL.createObjectURL(state.itemPng) // solo para preview
};

      if (state.editingIndex !== null) {
        state.totems[state.editingIndex] = newTotem;
        state.editingIndex = null;
      } else {
        state.totems.push(newTotem);
      }

      renderTotems();
      clearForm();
    });

    function renderTotems() {
      const container = $('#totemList');
      container.innerHTML = "";
      state.totems.forEach((t, i) => {
        const div = document.createElement('div');
        div.className = "flex items-center justify-between bg-slate-800/60 rounded-xl p-3 border border-slate-700";
        div.innerHTML = `
          <div class="truncate w-2/3">
            <h3 class="font-semibold text-cyan-300 truncate">${t.name}</h3>
            <p class="text-xs opacity-70 truncate">${t.id}</p>
          </div>
          <div class="flex items-center gap-2">
            <img src="${t.imgURL}" class="h-10 w-10 rounded-lg border border-slate-600 object-contain"/>
            <button class="edit px-2 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs text-white">Editar</button>
            <button class="delete px-2 py-1 rounded-xl bg-red-600 hover:bg-red-500 text-xs text-white">Borrar</button>
          </div>
        `;
        div.querySelector('.edit').addEventListener('click', () => loadTotem(i));
        div.querySelector('.delete').addEventListener('click', () => {
          state.totems.splice(i,1);
          renderTotems();
        });
        container.appendChild(div);
      });
    }

    function loadTotem(i) {
      const t = state.totems[i];
      $('#namespace').value = t.name;
      $('#totemId').value = t.id;
      $('#commandsInput').value = t.commands;
      effectsListEl.innerHTML = "";
      t.effects.forEach(e => createEffectItem(e.effect, e.duration, e.amplifier));
      $('#itemPreview').src = t.img;
      $('#itemPreview').classList.remove('hidden');
      state.editingIndex = i;
    }

    function clearForm() {
      $('#namespace').value = "";
      $('#totemId').value = "";
      $('#commandsInput').value = "";
      effectsListEl.innerHTML = "";
      createEffectItem();
      $('#itemPreview').classList.add('hidden');
      state.itemPng = null;
    }
    


$("#btnDownload").addEventListener("click", async () => {
  if (state.totems.length === 0) {
    alert("No hay tótems");
    return;
  }

  const zip = new JSZip();
  const rp = zip.folder("RP");
  const bp = zip.folder("BP");

  // ========= MANIFESTS =========
  rp.file("manifest.json", JSON.stringify({
    format_version: 2,
    header: {
      name: "Totems RP",
      description: "Addon generado desde web",
      uuid: generateUUID(),
      version: [1, 0, 0],
      min_engine_version: [1, 19, 0]
    },
    modules: [{
      type: "resources",
      uuid: generateUUID(),
      version: [1, 0, 0]
    }]
  }, null, 2));

  bp.file("manifest.json", JSON.stringify({
    format_version: 2,
    header: {
      name: "Totems BP",
      description: "Addon generado desde web",
      uuid: generateUUID(),
      version: [1, 0, 0],
      min_engine_version: [1, 19, 0]
    },
    modules: [{
      type: "data",
      uuid: generateUUID(),
      version: [1, 0, 0]
    }]
  }, null, 2));

  // ========= TEXTURES =========
  const textureData = {};
  const texturesFolder = rp.folder("textures/items/totems");

  state.totems.forEach(totem => {
    const safeName = totem.name.replace(/\s+/g, "_");

    textureData[totem.id] = {
      textures: `textures/items/totems/${safeName}`
    };

    // imagen real
    texturesFolder.file(`${safeName}.png`, totem.imgFile);
  });

  rp.folder("textures").file("item_texture.json", JSON.stringify({
    resource_pack_name: "Totems Pack",
    texture_name: "atlas.items",
    texture_data: textureData
  }, null, 2));
  
  //RenderControllers
  const textureArray = [
  "texture.default",
  "texture.totem"
];

// agregar TODOS los totems
state.totems.forEach(totem => {
  const safeName = totem.name.replace(/\s+/g, "_").toLowerCase();
  textureArray.push(`texture.${safeName}`);
});

const renderControllers = {
  format_version: "1.8.0",
  render_controllers: {
    "controller.render.totems": {
      materials: [
        { "*": "material.default" }
      ],
      arrays: {
        textures: {
          "Array.textures": textureArray
        }
      },
      geometry: "geometry.totem",
      textures: [
        "array.textures[query.property('test:totem')]"
      ],
      part_visibility: [
        { "*": true }
      ],
      is_hurt_color: { r: "0", g: "0", b: "0", a: "0" },
      on_fire_color: { r: "0", g: "0", b: "0", a: "0" }
    }
  }
};

rp
  .folder("render_controllers")
  .file(
    "totems.render_controllers.json",
    JSON.stringify(renderControllers, null, 2)
  );
  
 const playerTextures = {
  "default": "textures/entity/steve",
  "cape": "textures/entity/cape_invisible",
  "totem": "textures/items/totem"
};

state.totems.forEach(totem => {
  const safeName = totem.name.replace(/\s+/g, "_").toLowerCase();
  playerTextures[safeName] = `textures/items/totems/${safeName}`;
});

const playerEntity = {
  format_version: "1.10.0",
  "minecraft:client_entity": {
    description: {
      identifier: "minecraft:player",
      materials: {
        "default": "entity_alphatest",
        "cape": "entity_alphatest",
        "animated": "player_animated",
        "spectator": "player_spectator"
      },
      textures: playerTextures, // 👈 AQUÍ
      geometry: {
        "default": "geometry.humanoid.custom",
        "cape": "geometry.cape",
        "totem": "geometry.totem"
      },
      scripts: {
        scale: "0.9375",
        initialize: [
          "variable.is_holding_right = 0.0;",
          "variable.is_blinking = 0.0;",
          "variable.last_blink_time = 0.0;",
          "variable.hand_bob = 0.0;"
        ],
        pre_animation: [
          "variable.helmet_layer_visible = 1.0;",
          "variable.leg_layer_visible = 1.0;",
          "variable.boot_layer_visible = 1.0;",
          "variable.chest_layer_visible = 1.0;",
          "variable.attack_body_rot_y = Math.sin(360*Math.sqrt(variable.attack_time)) * 5.0;",
          "variable.tcos0 = (math.cos(query.modified_distance_moved * 38.17) * query.modified_move_speed / variable.gliding_speed_value) * 57.3;",
          "variable.first_person_rotation_factor = math.sin((1 - variable.attack_time) * 180.0);",
          "variable.hand_bob = query.life_time < 0.01 ? 0.0 : variable.hand_bob + ((query.is_on_ground && query.is_alive ? math.clamp(math.sqrt(math.pow(query.position_delta(0), 2.0) + math.pow(query.position_delta(2), 2.0)), 0.0, 0.1) : 0.0) - variable.hand_bob) * 0.02;",
          "variable.map_angle = math.clamp(1 - variable.player_x_rotation / 45.1, 0.0, 1.0);",
          "variable.item_use_normalized = query.main_hand_item_use_duration / query.main_hand_item_max_duration;"
        ],
        animate: ["root"]
      },
      animations: { 
      				"root": "controller.animation.player.root",
				"base_controller": "controller.animation.player.base",
				"hudplayer": "controller.animation.player.hudplayer",
				"humanoid_base_pose": "animation.humanoid.base_pose",
				"look_at_target": "controller.animation.humanoid.look_at_target",
				"look_at_target_ui": "animation.player.look_at_target.ui",
				"look_at_target_default": "animation.humanoid.look_at_target.default",
				"look_at_target_gliding": "animation.humanoid.look_at_target.gliding",
				"look_at_target_swimming": "animation.humanoid.look_at_target.swimming",
				"look_at_target_inverted": "animation.player.look_at_target.inverted",
				"cape": "animation.player.cape",
				"move.arms": "animation.player.move.arms",
				"move.legs": "animation.player.move.legs",
				"swimming": "animation.player.swim",
				"swimming.legs": "animation.player.swim.legs",
				"riding.arms": "animation.player.riding.arms",
				"riding.legs": "animation.player.riding.legs",
				"holding": "animation.player.holding",
				"brandish_spear": "animation.humanoid.brandish_spear",
				"charging": "animation.humanoid.charging",
				"attack.positions": "animation.player.attack.positions",
				"attack.rotations": "animation.player.attack.rotations",
				"sneaking": "animation.player.sneaking",
				"bob": "animation.player.bob",
				"damage_nearby_mobs": "animation.humanoid.damage_nearby_mobs",
				"bow_and_arrow": "animation.humanoid.bow_and_arrow",
				"use_item_progress": "animation.humanoid.use_item_progress",
				"skeleton_attack": "animation.skeleton.attack",
				"sleeping": "animation.player.sleeping",
				"first_person_base_pose": "animation.player.first_person.base_pose",
				"first_person_empty_hand": "animation.player.first_person.empty_hand",
				"first_person_swap_item": "animation.player.first_person.swap_item",
				"first_person_attack_controller": "controller.animation.player.first_person_attack",
				"first_person_attack_rotation": "animation.player.first_person.attack_rotation",
				"first_person_attack_rotation_item": "animation.player.first_person.attack_rotation_item",
				"first_person_vr_attack_rotation": "animation.player.first_person.vr_attack_rotation",
				"first_person_walk": "animation.player.first_person.walk",
				"first_person_map_controller": "controller.animation.player.first_person_map",
				"first_person_map_hold": "animation.player.first_person.map_hold",
				"first_person_map_hold_attack": "animation.player.first_person.map_hold_attack",
				"first_person_map_hold_off_hand": "animation.player.first_person.map_hold_off_hand",
				"first_person_map_hold_main_hand": "animation.player.first_person.map_hold_main_hand",
				"first_person_crossbow_equipped": "animation.player.first_person.crossbow_equipped",
				"first_person_crossbow_hold": "animation.player.first_person.crossbow_hold",
				"first_person_breathing_bob": "animation.player.first_person.breathing_bob",
				"third_person_crossbow_equipped": "animation.player.crossbow_equipped",
				"third_person_bow_equipped": "animation.player.bow_equipped",
				"crossbow_hold": "animation.player.crossbow_hold",
				"crossbow_controller": "controller.animation.player.crossbow",
				"shield_block_main_hand": "animation.player.shield_block_main_hand",
				"shield_block_off_hand": "animation.player.shield_block_off_hand",
				"blink": "controller.animation.persona.blink",
				"fishing_rod": "animation.humanoid.fishing_rod",
				"holding_spyglass": "animation.humanoid.holding_spyglass",
				"first_person_shield_block": "animation.player.first_person.shield_block",
				"tooting_goat_horn": "animation.humanoid.tooting_goat_horn",
				"holding_brush": "animation.humanoid.holding_brush",
				"brushing": "animation.humanoid.brushing",
				"crawling": "animation.player.crawl",
				"crawling.legs": "animation.player.crawl.legs"
       },
      render_controllers: [
        {
					"controller.render.totems": "query.property('test:enabled')&&query.is_local_player&&v.is_first_person"
				},
				{
					"controller.render.player.first_person_spectator": "variable.is_first_person&&query.is_spectator"
				},
				{
					"controller.render.player.third_person_spectator": "!variable.is_first_person&&!variable.map_face_icon&&query.is_spectator"
				},
				{
					"controller.render.player.first_person": "variable.is_first_person&&!query.is_spectator"
				},
				{
					"controller.render.player.third_person": "!variable.is_first_person&&!variable.map_face_icon&&!query.is_spectator"
				},
				{
					"controller.render.player.map": "variable.map_face_icon"
				}
 ],
      enable_attachables: true
    }
  }
};

rp
  .folder("entity")
  .file(
    "player.entity.json",
    JSON.stringify(playerEntity, null, 2)
  );
  
  let langContent = "";

state.totems.forEach(totem => {
  langContent += `item.${totem.id}=${totem.name}\n`;
});

rp
  .folder("texts")
  .file("en_US.lang", langContent);
  
  // BP Addon
  const anyOfArray = [
  {
    test: "has_equipment",
    operator: "==",
    domain: "hand",
    value: "test:totem"
  }
];

state.totems.forEach(totem => {
  anyOfArray.push({
    test: "has_equipment",
    operator: "==",
    domain: "hand",
    value: totem.id
  });
});

const playerBP = {
  format_version: "1.21.0",
  "minecraft:entity": {
    description: {
      identifier: "minecraft:player",
      spawn_category: "creature",
      is_spawnable: false,
      is_summonable: false,
      properties: {
        "test:totem": {
          client_sync: true,
          default: 0,
          type: "int",
          range: [0, 1000]
        },
        "test:enabled": {
          client_sync: true,
          default: false,
          type: "bool"
        }
      }
    },

    component_groups: {
      "minecraft:add_raid_omen": {
        "minecraft:spell_effects": {
          add_effects: [
            {
              effect: "raid_omen",
              duration: 30,
              display_on_screen_animation: true
            }
          ],
          remove_effects: "bad_omen"
        },
        "minecraft:timer": {
          time: [0, 0],
          looping: false,
          time_down_event: {
            event: "minecraft:clear_add_raid_omen",
            target: "self"
          }
        }
      },

      "minecraft:clear_raid_omen_spell_effect": {
        "minecraft:spell_effects": {}
      },

      "minecraft:raid_trigger": {
        "minecraft:raid_trigger": {
          triggered_event: {
            event: "minecraft:remove_raid_trigger",
            target: "self"
          }
        }
      }
    },

    components: {
      "minecraft:experience_reward": {
        on_death: "math.min(query.player_level*7,100)"
      },

      "minecraft:type_family": {
        family: ["player"]
      },

      "minecraft:is_hidden_when_invisible": {},

      "minecraft:loot": {
        table: "loot_tables/empty.json"
      },

      "minecraft:collision_box": {
        width: 0.6,
        height: 1.8
      },

      "minecraft:can_climb": {},

      "minecraft:movement": {
        value: 0.1
      },

      "minecraft:damage_sensor": {
        triggers: [
          {
            on_damage: {
              filters: {
                all_of: [
                  {
                    any_of: anyOfArray
                  },
                  {
                    test: "has_damage",
                    subject: "self",
                    operator: "==",
                    value: "fatal"
                  }
                ]
              },
              event: "test:pop"
            },
            deals_damage: false
          }
        ]
      },

      "minecraft:hurt_on_condition": {
        damage_conditions: [
          {
            filters: {
              test: "in_lava",
              subject: "self",
              operator: "==",
              value: true
            },
            cause: "lava",
            damage_per_tick: 4
          }
        ]
      },

      "minecraft:attack": {
        damage: 1
      },

      "minecraft:exhaustion_values": {
        heal: 6,
        jump: 0.05,
        sprint_jump: 0.2,
        mine: 0.005,
        attack: 0.1,
        damage: 0.1,
        walk: 0,
        sprint: 0.1,
        swim: 0.01
      },

      "minecraft:player.saturation": {
        value: 5,
        max: 20
      },

      "minecraft:player.exhaustion": {
        value: 0,
        max: 20
      },

      "minecraft:player.level": {
        value: 0,
        max: 24791
      },

      "minecraft:player.experience": {
        value: 0,
        max: 1
      },

      "minecraft:breathable": {
        total_supply: 15,
        suffocate_time: -1,
        inhale_time: 3.75,
        generates_bubbles: false
      },

      "minecraft:nameable": {
        always_show: true,
        allow_name_tag_renaming: false
      },

      "minecraft:physics": {
        push_towards_closest_space: true
      },

      "minecraft:pushable": {
        is_pushable: false,
        is_pushable_by_piston: true
      },

      "minecraft:insomnia": {
        days_until_insomnia: 3
      },

      "minecraft:rideable": {
        seat_count: 2,
        family_types: ["parrot_tame"],
        pull_in_entities: true,
        seats: [
          {
            position: [0.4, -0.2, -0.1],
            min_rider_count: 0,
            max_rider_count: 0,
            lock_rider_rotation: 0
          },
          {
            position: [-0.4, -0.2, -0.1],
            min_rider_count: 1,
            max_rider_count: 2,
            lock_rider_rotation: 0
          }
        ]
      },

      "minecraft:conditional_bandwidth_optimization": {},

      "minecraft:block_climber": {},

      "minecraft:environment_sensor": {
        triggers: {
          filters: {
            all_of: [
              {
                test: "has_mob_effect",
                subject: "self",
                value: "bad_omen"
              },
              {
                test: "is_in_village",
                subject: "self",
                value: true
              }
            ]
          },
          event: "minecraft:gain_raid_omen"
        }
      }
    },

    events: {
      "test:pop": {
        queue_command: {
          command: "scriptevent totem:pop"
        }
      },

      "minecraft:gain_raid_omen": {
        add: {
          component_groups: ["minecraft:add_raid_omen"]
        }
      },

      "minecraft:clear_add_raid_omen": {
        remove: {
          component_groups: ["minecraft:add_raid_omen"]
        },
        add: {
          component_groups: ["minecraft:clear_raid_omen_spell_effect"]
        }
      },

      "minecraft:trigger_raid": {
        add: {
          component_groups: ["minecraft:raid_trigger"]
        }
      },

      "minecraft:remove_raid_trigger": {
        remove: {
          component_groups: ["minecraft:raid_trigger"]
        }
      }
    }
  }
};
    events: {
      "test:pop": {
        queue_command: {
          command: "scriptevent totem:pop"
        }
      }
    }
  }
};

bp
  .folder("entities")
  .file(
    "player.json",
    JSON.stringify(playerBP, null, 2)
  );
  
  const totemEffectsObj = {
  "test:totem": {
    index: 0,
    effects: [
      { id: "regeneration", duration: 45 * 20, amplifier: 1 }
    ],
    commands: [
      { command: "say hello" }
    ]
  }
};

state.totems.forEach((totem, i) => {
  totemEffectsObj[totem.id] = {
    index: i + 1,
    effects: totem.effects.map(effect => ({
      id: effect.effect,
      duration: Number(effect.duration) * 20,
      amplifier: Number(effect.amplifier)
    })),
    commands: totem.commands
      ? totem.commands
          .split("\n")
          .filter(c => c.trim())
          .map(cmd => ({ command: cmd }))
      : []
  };
});

const mainJsContent = `
import { world, system } from "@minecraft/server";

const totemEffects = ${JSON.stringify(totemEffectsObj, null, 2)};

system.afterEvents.scriptEventReceive.subscribe(ev => {
  if (ev.id !== 'totem:pop') return;

  const entity = ev.sourceEntity;
  if (!entity) return;

  const equippable = entity.getComponent('equippable');
  const offHandItem = equippable.getEquipment('Offhand');
  const mainHandItem = equippable.getEquipment('Mainhand');

  const offhand = offHandItem?.typeId?.includes('totem') ?? false;
  const totemType = offhand ? offHandItem?.typeId : mainHandItem?.typeId;
  const totemData = totemEffects[totemType];
  if (!totemData) return;

  const health = entity.getComponent('health');
  const currentHealth = health.currentValue;

  equippable.setEquipment(offhand ? "Offhand" : "Mainhand", null);

  entity.applyDamage(currentHealth - 2);
  if (health.currentValue > 2) health.setCurrentValue(2);

  entity.playAnimation("animation.model.totem", { blendOutTime: 2 });
  entity.setProperty("test:totem", totemData.index);
  entity.setProperty("test:enabled", true);

  entity.dimension.playSound("random.totem", entity.location);
  entity.dimension.spawnParticle("minecraft:totem_particle", {
    x: entity.location.x,
    y: entity.location.y + 1,
    z: entity.location.z
  });

  totemData.effects.forEach(e =>
    entity.addEffect(e.id, e.duration, { amplifier: e.amplifier ?? 0 })
  );

  totemData.commands.forEach(c =>
    entity.runCommand(c.command)
  );

  system.runTimeout(() => {
    entity.setProperty("test:enabled", false);
  }, 40);
});
`;

bp
  .folder("scripts")
  .file("main.js", mainJsContent);

state.totems.forEach(totem => {
  const safeName = totem.name.replace(/\s+/g, "_").toLowerCase();

  const itemJson = {
    format_version: "1.20.80",
    "minecraft:item": {
      description: {
        identifier: totem.id,
        menu_category: {
          category: "equipment"
        }
      },
      components: {
        "minecraft:icon": safeName,
 "minecraft:max_stack_size": 1
      }
    }
  };

  // Ruta EXACTA solicitada
  const path = `BP/items/${safeName}.json`;
bp
  .folder("items")
  .file(
    `${safeName}.json`,
    JSON.stringify(itemJson, null, 2)
  );
 
});  
const animations = {
	"format_version": "1.8.0",
	"animations": {
		"animation.model.totem": {
			"animation_length": 2.2,
			"bones": {
				"bone": {
					"rotation": {
						"0.0": [
							0,
							0,
							0
						],
						"0.7917": {
							"pre": [
								360,
								-1797.5,
								0
							],
							"post": [
								360,
								-1797.5,
								0
							],
							"lerp_mode": "catmullrom"
						},
						"1.2917": {
							"post": [
								357.88536,
								-1796.98041,
								7.49861
							],
							"lerp_mode": "catmullrom"
						},
						"1.5833": {
							"post": [
								357.28197,
								-1797.50952,
								-5.00474
							],
							"lerp_mode": "catmullrom"
						},
						"1.875": {
							"post": [
								357.75563,
								-1797.0755,
								4.99706
							],
							"lerp_mode": "catmullrom"
						},
						"2.2": [
							0,
							0,
							0
						]
					},
					"position": {
						"0.0": [
							0,
							-16,
							21
						],
						"0.7917": {
							"pre": [
								0,
								0,
								1
							],
							"post": [
								0,
								0,
								1
							],
							"lerp_mode": "catmullrom"
						},
						"1.2917": {
							"post": [
								0,
								0,
								1
							],
							"lerp_mode": "catmullrom"
						},
						"1.5833": {
							"post": [
								0,
								0,
								1
							],
							"lerp_mode": "catmullrom"
						},
						"1.875": {
							"post": [
								0,
								0,
								1
							],
							"lerp_mode": "catmullrom"
						},
						"2.2": [
							0,
							-16,
							21
						]
					},
					"scale": {
						"0.0": [
							0,
							0,
							0
						],
						"0.7917": {
							"pre": [
								1,
								1,
								1
							],
							"post": [
								1,
								1,
								1
							],
							"lerp_mode": "catmullrom"
						},
						"1.2917": {
							"post": [
								1,
								1,
								1
							],
							"lerp_mode": "catmullrom"
						},
						"1.5833": {
							"post": [
								1,
								1,
								1
							],
							"lerp_mode": "catmullrom"
						},
						"1.875": {
							"post": [
								1,
								1,
								1
							],
							"lerp_mode": "catmullrom"
						},
						"2.2": [
							0,
							0,
							0
						]
					}
				}
			}
		}
	}
}

rp
  .folder("animations")
  .file(
    "totem.animation.json",
    JSON.stringify(animations, null, 2)
  );
  
const response = await fetch("./totem.geo.json");
  const geoText = await response.text();

  zip.file("RP/models/entity/totem.geo.json", geoText);
  
const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, "Totems_Addon.zip");
});
                
