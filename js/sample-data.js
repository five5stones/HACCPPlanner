/**
 * Pre-filled Sandwich Production HACCP from source PDF.
 */

const SANDWICH_SAMPLE = {
  title: 'Sandwich Production HACCP',
  version: 1,
  footnote:
    'Listeria monocytogenes: Use of pasteurised ingredients; GMPs to prevent cross-contamination; cleaning and sanitising of equipment and surfaces; adequate storage temperatures. Zero tolerance in finished product. Daily visual inspection; temperature monitoring. Corrective actions: remove contaminated equipment, discard contaminated products, investigate root cause, regular swabbing per listeria testing schedule.',
  processSteps: [
      {
          "id": "step-supplier-audit",
          "name": "Supplier Approval",
          "stepNo": "1",
          "isCcp": true,
          "hazards": [
              {
                  "id": "h-supplier-audit",
                  "text": "Unapproved or non-compliant food supplier"
              }
          ],
          "controlMeasures": [
              "Delist or re-audit supplier"
          ],
          "criticalLimits": [
              "Per schedule"
          ],
          "monitoringProcedures": [
              "Supplier review against approved list"
          ],
          "frequencies": [
              "Per schedule"
          ],
          "correctiveActions": [
              "Delist or re-audit supplier"
          ],
          "records": [
              "Supplier audit records"
          ]
      },
      {
          "id": "step-raw-purchase",
          "name": "Raw Materials Purchase",
          "stepNo": "2",
          "isCcp": true,
          "hazards": [
              {
                  "id": "h-purchase-bacteria",
                  "text": "Food contaminated by bacteria or pathogens from supplier"
              },
              {
                  "id": "h-purchase-cross-contact",
                  "text": "Cross contact with foreign matter"
              }
          ],
          "controlMeasures": [
              "Buy from our approved suppliers list on Cybake who have been checked. As per Product Specification Standard: buying specification, supplier self-audit questionnaire, supplier audit, external accreditation"
          ],
          "criticalLimits": [
              "As per Product Specification Standard"
          ],
          "monitoringProcedures": [
              "Technical specification, supplier self-assessment form (SP1), audit report, accreditation certificate"
          ],
          "frequencies": [
              "Per Schedule"
          ],
          "correctiveActions": [
              "Delist Or Re-Audit Supplier"
          ],
          "records": [
              "Technical specification, supplier self-assessment form (SP1), audit report, accreditation certificate"
          ]
      },
      {
          "id": "step-receipt",
          "name": "Receipt of Raw Materials",
          "stepNo": "",
          "isCcp": false,
          "hazards": [
              {
                  "id": "h-receipt-temp",
                  "text": "Raw material temperature out of specification"
              },
              {
                  "id": "h-receipt-foreign-body",
                  "text": "Foreign body / cross contact"
              },
              {
                  "id": "h-receipt-shelf-life",
                  "text": "Raw material at end of shelf life"
              }
          ],
          "controlMeasures": [
              "Temperature check on delivery and stored as quickly as possible. Goods-in check against specification, particularly for higher-risk ingredients such as eggs (reputable source, suitable quality — ideally not class B). Care with herbs and spices which can contain Salmonella",
              "Visual check. Deliveries and vehicles to be in a clean and sound condition. All raw materials to have adequate shelf life",
              "Visual check — all raw materials to have adequate shelf life"
          ],
          "criticalLimits": [
              "Chilled: max +8°C. Frozen target -18°C, min -12°C",
              "No damaged goods; adequate shelf life",
              "Within use-by / best-before date"
          ],
          "monitoringProcedures": [
              "Goods-in check against specification; visual check on receipt; visual check and date verification"
          ],
          "frequencies": [
              "Per delivery"
          ],
          "correctiveActions": [
              "Chilled: reject if above +8°C. Frozen: reject if above -12°C",
              "Reject damaged goods; reject raw materials with inadequate shelf-life",
              "Reject raw materials with inadequate shelf-life"
          ],
          "records": [
              "Records kept on Purchase Order (SP2)",
              "Reject Form (QC1)",
              "Reject Form (QC1)"
          ]
      },
      {
          "id": "step-storage-raw",
          "name": "Storage of Raw Materials",
          "stepNo": "3",
          "isCcp": true,
          "hazards": [
              {
                  "id": "h-storage-temp",
                  "text": "Raw material temperature out of specification"
              },
              {
                  "id": "h-storage-shelf-life",
                  "text": "Raw material at or near end of shelf life"
              },
              {
                  "id": "h-storage-allergen",
                  "text": "Cross contact of allergens — packaging not intact"
              }
          ],
          "controlMeasures": [
              "Store chilled and frozen materials under correct conditions",
              "Do not use out-of-date raw materials. Daily date checks and stock rotation",
              "Visual checks — packaging must be intact, no cross contacts"
          ],
          "criticalLimits": [
              "Chilled: max +8°C. Frozen target -18°C, min -12°C",
              "Within shelf life; FIFO rotation",
              "Intact packaging; segregated storage"
          ],
          "monitoringProcedures": [
              "Daily temperature checks",
              "Daily date checks and stock rotation",
              "Visual checks"
          ],
          "frequencies": [
              "Daily"
          ],
          "correctiveActions": [
              "Reject any materials out of specification, out of rotation or in danger of cross contact",
              "Do not use out-of-date raw materials",
              "Reject damaged goods"
          ],
          "records": [
              "Daily temperature Record Form (MP2)",
              "Opening and Closing checks (MP3)",
              "Reject Form (QC1)"
          ]
      },
      {
          "id": "step-defrost",
          "name": "Defrosting",
          "stepNo": "4",
          "isCcp": false,
          "hazards": [
              {
                  "id": "h-defrost-temp",
                  "text": "High microbial growth due to temperature abuse and extended time"
              },
              {
                  "id": "h-defrost-storage",
                  "text": "Foreign body due to cross contact during storage"
              }
          ],
          "controlMeasures": [
              "Defrost under controlled conditions. Monitor 'Use By' date. Product temp should be <8°C within 24 hours with sufficient shelf life",
              "Storage checks — no cross contacts"
          ],
          "criticalLimits": [
              "Product <8°C within 24 hours; sufficient shelf life",
              "Segregated, clean storage"
          ],
          "monitoringProcedures": [
              "Check final temperatures and time period; shelf life checks",
              "Visual checks"
          ],
          "frequencies": [
              "Per defrost cycle"
          ],
          "correctiveActions": [
              "Reject products if above >8°C at any time",
              "Reject contaminated product"
          ],
          "records": [
              "Defrost Log (MP4)"
          ]
      },
      {
          "id": "step-salad-clean",
          "name": "Salad and Vegetable Cleaning",
          "stepNo": "5",
          "isCcp": false,
          "hazards": [
              {
                  "id": "h-salad-spoilage",
                  "text": "Spoilage of salad vegetables and fruit due to bacteria and pathogens"
              }
          ],
          "controlMeasures": [
              "All salad vegetables and fruit to be washed prior to use (except prewashed items). Disinfection by chemical means, often chlorine — use contact time and strength as recommended by manufacturer"
          ],
          "criticalLimits": [
              "Correct chemical concentration and contact time per Milton Procedure (MP6)"
          ],
          "monitoringProcedures": [
              "Check chemical solution is at correct concentration"
          ],
          "frequencies": [
              "Every batch"
          ],
          "correctiveActions": [
              "Isolate and identify any vegetables, salad and fruit that have not been washed properly and reject"
          ],
          "records": [
              "Reject Form (QC1)"
          ]
      },
      {
          "id": "step-wip-chill",
          "name": "Work in Progress Chilled Storage",
          "stepNo": "6",
          "isCcp": false,
          "hazards": [
              {
                  "id": "h-wip-temp",
                  "text": "High microbial growth due to temperature abuse and extended time"
              },
              {
                  "id": "h-wip-covered",
                  "text": "Foreign body / contamination during WIP storage"
              },
              {
                  "id": "h-wip-allergen",
                  "text": "Cross contact of allergens"
              }
          ],
          "controlMeasures": [
              "WIP chill to operate at 0–5°C, max 8°C",
              "All products must be covered",
              "All materials adequately covered, labelled and segregated into allergen groups"
          ],
          "criticalLimits": [
              "Max +8°C",
              "All products covered and labelled",
              "Covered, labelled, allergen-segregated"
          ],
          "monitoringProcedures": [
              "Visual checks and temperature monitoring",
              "Visual checks",
              "Visual checks"
          ],
          "frequencies": [
              "Every shift"
          ],
          "correctiveActions": [
              "Reject any products or components contaminated or suspected of temperature abuse",
              "Reject contaminated product",
              "Reject contaminated batch"
          ],
          "records": [
              "Daily temperature Record Form (MP2)",
              "Reject Form (QC1)",
              "Reject Form (QC1)"
          ]
      },
      {
          "id": "step-high-risk-prep",
          "name": "High Risk Preparation — Slicing, Dicing and Can Opening",
          "stepNo": "7",
          "isCcp": false,
          "hazards": [
              {
                  "id": "h-prep-time-temp",
                  "text": "Time/temperature abuse of raw materials and mixes"
              },
              {
                  "id": "h-prep-microbial",
                  "text": "Microbial cross contact"
              },
              {
                  "id": "h-prep-metal",
                  "text": "Contamination by metal — cutting blade condition"
              }
          ],
          "controlMeasures": [
              "Mixing/slicing carried out as rapid as possible",
              "Scheduled cleaning and hygiene barrier controls",
              "No damage to blades"
          ],
          "criticalLimits": [
              "Proteins/mayonnaise mixes max 8°C; veg/salad max 10°C",
              "As per agreed cleaning procedures",
              "Blades in good condition"
          ],
          "monitoringProcedures": [
              "Visual inspection",
              "Visual inspection",
              "Visual inspection of blades"
          ],
          "frequencies": [
              "Daily",
              "Daily",
              "Each shift"
          ],
          "correctiveActions": [
              "Reject temperature abused materials",
              "Reclean and retrain",
              "Reject form; replace damaged blades"
          ],
          "records": [
              "Reject Form (QC1)",
              "Cleaning Records (C1)",
              "Reject Form (QC1)"
          ]
      },
      {
          "id": "step-labelling-ingredients",
          "name": "Labelling Ingredients and Mixes",
          "stepNo": "8",
          "isCcp": false,
          "hazards": [
              {
                  "id": "h-label-date",
                  "text": "High microbial growth due to temperature abuse and extended time"
              },
              {
                  "id": "h-label-allergen",
                  "text": "Incorrect label could expose consumer to potential allergen"
              },
              {
                  "id": "h-label-storage-temp",
                  "text": "Incorrect storage temperature on label leads to microbial growth"
              }
          ],
          "controlMeasures": [
              "As per Product Specification or ratified by Extended Shelf Life Policy (MP8). Labels set by Shelf Life Matrix (DB1) and Extended Shelf Life Policy (MP8)",
              "Label checks against issued information",
              "Labels set by Shelf Life Matrix (DB1) and Extended Shelf Life Policy (MP8)"
          ],
          "criticalLimits": [
              "Clear and correct date as per Product Shelf Life Matrix (MP6) and Extended Shelf Life Policy (MP8)",
              "Label matches issued specification",
              "Correct storage instructions on label"
          ],
          "monitoringProcedures": [
              "Monitor and record date code. Check 'Use By' date is legible",
              "Label checks",
              "Label checks against issued information"
          ],
          "frequencies": [
              "Each production"
          ],
          "correctiveActions": [
              "Reject any products with incorrect 'use by' date, illegible code or incorrect labelling",
              "Reject incorrectly labelled product",
              "Reject incorrectly labelled product"
          ],
          "records": [
              "Label Check Form (QC2)"
          ]
      },
      {
          "id": "step-assembly",
          "name": "Sandwich Assembly",
          "stepNo": "9",
          "isCcp": false,
          "hazards": [
              {
                  "id": "h-assembly-time-temp",
                  "text": "Time/temperature abuse of raw materials and mixes"
              },
              {
                  "id": "h-assembly-foreign-body",
                  "text": "Foreign body cross contact from packaging or extrinsic source"
              },
              {
                  "id": "h-assembly-cross-contact",
                  "text": "Cross contact introduced by staff or food contact surfaces"
              }
          ],
          "controlMeasures": [
              "Room kept in air condition settings; assembly time kept below 60 mins per batch/product. Raw materials brought onto line from WIP chill just before use",
              "Products passed straight through into despatch — no foreign bodies present",
              "As per agreed cleaning procedures"
          ],
          "criticalLimits": [
              "Assembly time below 60 mins per batch; min time in air-con room",
              "No foreign bodies present",
              "Clean food contact surfaces"
          ],
          "monitoringProcedures": [
              "Visual inspection each batch",
              "Visual inspection",
              "Visual inspection"
          ],
          "frequencies": [
              "Each batch"
          ],
          "correctiveActions": [
              "Reject temperature abused products",
              "Reject contaminated products",
              "Reject contaminated batch"
          ],
          "records": [
              "Reject Log",
              "Reject Log",
              "Cleaning Records (C1) and Weekly Metal and Knives Register (MP6)"
          ]
      },
      {
          "id": "step-cutting",
          "name": "Cutting",
          "stepNo": "10",
          "isCcp": false,
          "hazards": [
              {
                  "id": "h-cutting-metal",
                  "text": "Contamination by metal — condition of knives"
              },
              {
                  "id": "h-cutting-microbial",
                  "text": "Microbial cross contact"
              }
          ],
          "controlMeasures": [
              "No damage to knives",
              "Disinfection between two production runs"
          ],
          "criticalLimits": [
              "Knives in good condition",
              "Clean and sanitised between runs"
          ],
          "monitoringProcedures": [
              "Visual inspection"
          ],
          "frequencies": [
              "Daily",
              "Per run"
          ],
          "correctiveActions": [
              "If damaged, replace knives",
              "Reclean before next run"
          ],
          "records": [
              "Weekly Metal and Knives Register (MP6)",
              "Cleaning Records (C1)"
          ]
      },
      {
          "id": "step-packing",
          "name": "Packing",
          "stepNo": "11",
          "isCcp": false,
          "hazards": [
              {
                  "id": "h-packing-temp",
                  "text": "High microbial growth due to temperature abuse"
              }
          ],
          "controlMeasures": [
              "Pack finished product as quickly as possible in the sorting fridges"
          ],
          "criticalLimits": [
              "Finished products packed as quickly as possible"
          ],
          "monitoringProcedures": [
              "Temperature check"
          ],
          "frequencies": [
              "Each shift"
          ],
          "correctiveActions": [
              "Reject temperature abused products"
          ],
          "records": [
              "Temperature Checks (MP2); Reject Form (QC1)"
          ]
      },
      {
          "id": "step-labelling-finished",
          "name": "Labelling",
          "stepNo": "12",
          "isCcp": false,
          "hazards": [
              {
                  "id": "h-finished-label",
                  "text": "Incorrect labelling — allergen or date code risk"
              }
          ],
          "controlMeasures": [
              "Label checks against issued information. As per Product Specification"
          ],
          "criticalLimits": [
              "Correct label per specification"
          ],
          "monitoringProcedures": [
              "Label checks"
          ],
          "frequencies": [
              "Each shift"
          ],
          "correctiveActions": [
              "Reject incorrectly labelled product"
          ],
          "records": [
              "Label Check Form (QC2)"
          ]
      },
      {
          "id": "step-storage-despatch-prep",
          "name": "Storage before Despatch",
          "stepNo": "13",
          "isCcp": false,
          "hazards": [
              {
                  "id": "h-pre-despatch-temp",
                  "text": "Microbial growth due to temperature abuse and extended time"
              }
          ],
          "controlMeasures": [
              "All products stored under chilled conditions"
          ],
          "criticalLimits": [
              "Target 0–5°C, max 8°C"
          ],
          "monitoringProcedures": [
              "Temperature check"
          ],
          "frequencies": [
              "Each shift"
          ],
          "correctiveActions": [
              "Reject temperature abused products"
          ],
          "records": [
              "Reject Form (QC1); Opening and Closing checks (MP3)"
          ]
      },
      {
          "id": "step-storage-despatch",
          "name": "Storage in Despatch / Transport",
          "stepNo": "14",
          "isCcp": true,
          "hazards": [
              {
                  "id": "h-despatch-temp",
                  "text": "High microbial growth due to temperature abuse during transport"
              },
              {
                  "id": "h-despatch-listeria",
                  "text": "Listeria monocytogenes growth and contamination"
              }
          ],
          "controlMeasures": [
              "All products transported under chilled conditions",
              "Pasteurised ingredients; GMPs to prevent cross-contamination; cleaning and sanitising; adequate storage temperatures"
          ],
          "criticalLimits": [
              "Target 0–5°C, max 8°C",
              "Zero tolerance in finished product"
          ],
          "monitoringProcedures": [
              "Van check temperature",
              "Daily visual inspection; temperature monitoring of storage areas and finished products"
          ],
          "frequencies": [
              "Each delivery",
              "Daily checks per opening/closing checks"
          ],
          "correctiveActions": [
              "When van temperature is >8°C, check product and reject if >8°C",
              "Remove contaminated equipment/surfaces; discard contaminated ingredients or finished products; investigate root cause; regular swabbing per listeria testing schedule"
          ],
          "records": [
              "Reject Log; van delivery temp checks (V1)",
              "Listeria testing schedule records"
          ]
      },
      {
          "id": "step-ref-listeria",
          "name": "Listeria",
          "stepNo": "",
          "isCcp": false,
          "isReferenceStep": true,
          "hazards": [
              {
                  "id": "h-ref-listeria",
                  "text": "Listeria monocytogenes growth and contamination"
              }
          ],
          "controlMeasures": [
              "Use of pasteurized ingredients",
              "Implementation of Good Manufacturing Practices (GMPs) to prevent cross-contamination",
              "Cleaning and sanitizing of equipment and surfaces",
              "Adequate storage temperatures for ingredients and finished products"
          ],
          "criticalLimits": [
              "Zero tolerance in the finished product."
          ],
          "monitoringProcedures": [
              "Daily visual inspection of the production area and equipment for cleanliness",
              "Temperature monitoring of storage areas and finished products",
              "Regular swabbing and testing of surfaces for Listeria monocytogenes"
          ],
          "frequencies": [
              "Daily checks per opening/closing checks",
              "Daily checks per opening/closing checks",
              "As per listeria testing schedule"
          ],
          "correctiveActions": [
              "Immediate removal of any contaminated equipment or surfaces",
              "Discarding any contaminated ingredients or finished products",
              "Investigating and addressing the root cause of contamination",
              "Implementing corrective actions to prevent future contamination"
          ],
          "records": [
              "Reject Form (QC1)"
          ]
      }
  ],
};
