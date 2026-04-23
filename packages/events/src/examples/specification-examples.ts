import { LetterVariant } from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/letter-variant";
import { PackSpecification } from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/pack-specification";

const bauStandardC5: PackSpecification = {
  id: "bau-standard-c5",
  name: "BAU Standard Letter C5",
  status: "PROD",
  version: 1,
  createdAt: "2023-01-01T00:00:00Z",
  updatedAt: "2023-01-01T00:00:00Z",
  billingId: "BILLING-BAU-C5-001",
  constraints: {
    sheets: {
      value: 5,
      operator: "LESS_THAN_OR_EQUAL",
    },
  },
  postage: {
    id: "ECONOMY",
    size: "STANDARD",
    deliveryDays: 3,
  },
  assembly: {
    envelopeId: "envelope-nhs-c5-economy",
    printColour: "BLACK",
  },
};

const bauStandardC4: PackSpecification = {
  id: "bau-standard-c4",
  name: "BAU Standard Letter C4",
  status: "PROD",
  version: 1,
  createdAt: "2023-01-01T00:00:00Z",
  updatedAt: "2023-01-01T00:00:00Z",
  billingId: "BILLING-BAU-C4-001",
  constraints: {
    sheets: {
      value: 20,
      operator: "LESS_THAN_OR_EQUAL",
    },
  },
  postage: {
    id: "ECONOMY",
    size: "LARGE",
    deliveryDays: 3,
  },
  assembly: {
    envelopeId: "envelope-nhs-c4-economy",
    printColour: "BLACK",
  },
};

const braille: PackSpecification = {
  id: "braille",
  name: "Braille Letter",
  status: "PROD",
  version: 1,
  createdAt: "2023-01-01T00:00:00Z",
  updatedAt: "2023-01-01T00:00:00Z",
  billingId: "BILLING-BRAILLE-001",
  constraints: {
    sheets: {
      value: 5,
      operator: "LESS_THAN_OR_EQUAL",
    },
  },
  postage: {
    id: "ARTICLES_BLIND",
    size: "STANDARD",
  },
  assembly: {
    features: ["BRAILLE"],
    printColour: "BLACK",
  },
};

const audio: PackSpecification = {
  id: "audio",
  name: "Audio Letter",
  status: "PROD",
  version: 1,
  createdAt: "2023-01-01T00:00:00Z",
  updatedAt: "2023-01-01T00:00:00Z",
  billingId: "BILLING-AUDIO-001",
  constraints: {
    sheets: {
      value: 5,
      operator: "LESS_THAN_OR_EQUAL",
    },
  },
  postage: {
    id: "ARTICLES_BLIND",
    size: "STANDARD",
  },
  assembly: {
    features: ["AUDIO"],
    printColour: "BLACK",
  },
};

const sameDay: PackSpecification = {
  id: "same-day",
  name: "Same Day Letter",
  status: "PROD",
  version: 1,
  createdAt: "2023-01-01T00:00:00Z",
  updatedAt: "2023-01-01T00:00:00Z",
  billingId: "BILLING-SAME-DAY-001",
  constraints: {
    sheets: {
      value: 5,
      operator: "LESS_THAN_OR_EQUAL",
    },
  },
  postage: {
    id: "FIRST",
    size: "LARGE",
    deliveryDays: 1,
  },
  assembly: {
    envelopeId: "envelope-nhs-c4-same-day",
    printColour: "COLOUR",
  },
};

const clientPack1: PackSpecification = {
  id: "client1-campaign1",
  name: "Client1 Letter Pack 1",
  status: "PROD",
  version: 1,
  createdAt: "2023-01-01T00:00:00Z",
  updatedAt: "2023-01-01T00:00:00Z",
  billingId: "BILLING-CLIENT1-001",
  constraints: {
    sheets: {
      value: 4,
      operator: "LESS_THAN_OR_EQUAL",
    },
  },
  postage: {
    id: "ADMAIL",
    size: "STANDARD",
    deliveryDays: 3,
  },
  assembly: {
    envelopeId: "client1-envelope1-c5",
    features: ["ADMAIL"],
    printColour: "COLOUR",
  },
};

const packs = {
  bauStandardC5,
  bauStandardC4,
  braille,
  audio,
  sameDay,
  clientPack1,
};

const variants: Record<string, LetterVariant> = {
  bauStandard: {
    id: "bau-standard",
    name: "BAU Standard Letter",
    description: "BAU Standard Letter",
    volumeGroupId: "volume-group-12345",
    packSpecificationIds: [bauStandardC5.id, bauStandardC4.id],
    type: "STANDARD",
    priority: 10,
    status: "PROD",
    constraints: {
      sheets: {
        value: 20,
        operator: "LESS_THAN_OR_EQUAL",
      },
      deliveryDays: {
        value: 3,
        operator: "LESS_THAN_OR_EQUAL",
      },
    },
  },
  braille: {
    id: "braille",
    name: "Braille Letter",
    description: "Braille Letter",
    volumeGroupId: "volume-group-12345",
    packSpecificationIds: [braille.id],
    type: "BRAILLE",
    priority: 20,
    status: "PROD",
    constraints: {
      sheets: {
        value: 5,
        operator: "LESS_THAN_OR_EQUAL",
      },
      deliveryDays: {
        value: 3,
        operator: "LESS_THAN_OR_EQUAL",
      },
    },
  },
  audio: {
    id: "audio",
    name: "Audio Letter",
    description: "Audio Letter",
    volumeGroupId: "volume-group-12345",
    packSpecificationIds: [audio.id],
    type: "AUDIO",
    priority: 30,
    status: "PROD",
    constraints: {
      sheets: {
        value: 5,
        operator: "LESS_THAN_OR_EQUAL",
      },
      deliveryDays: {
        value: 3,
        operator: "LESS_THAN_OR_EQUAL",
      },
    },
  },
  sameDay: {
    id: "same-day",
    name: "Same Day Letter",
    description: "Same Day Letter",
    volumeGroupId: "volume-group-12345",
    packSpecificationIds: [sameDay.id],
    type: "STANDARD",
    priority: 5,
    status: "PROD",
    constraints: {
      sheets: {
        value: 5,
        operator: "LESS_THAN_OR_EQUAL",
      },
      deliveryDays: {
        value: 1,
        operator: "LESS_THAN_OR_EQUAL",
      },
    },
  },
  campaign1: {
    id: "client1",
    name: "Client 1 Letter Variant 1",
    description: "Client 1 Letter Variant 1",
    volumeGroupId: "volume-group-campaign1",
    packSpecificationIds: [clientPack1.id],
    type: "STANDARD",
    priority: 40,
    status: "PROD",
    clientId: "client1",
    campaignIds: ["client1-campaign1"],
    constraints: {
      sheets: {
        value: 4,
        operator: "LESS_THAN_OR_EQUAL",
      },
      deliveryDays: {
        value: 3,
        operator: "LESS_THAN_OR_EQUAL",
      },
    },
  },
};

// eslint-disable-next-line no-console
console.log(JSON.stringify({ packs, variants }, null, 2));
