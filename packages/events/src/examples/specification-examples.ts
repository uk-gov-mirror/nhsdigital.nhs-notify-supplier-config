import {
  LetterVariant,
  LetterVariantId,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/letter-variant";
import {
  EnvelopeId,
  PackSpecification,
  PackSpecificationId,
  PostageId,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/pack-specification";
import { VolumeGroupId } from "../domain";

const bauStandardC5: PackSpecification = {
  id: PackSpecificationId("bau-standard-c5"),
  name: "BAU Standard Letter C5",
  status: "PROD",
  version: 1,
  createdAt: "2023-01-01T00:00:00Z",
  updatedAt: "2023-01-01T00:00:00Z",
  constraints: {
    maxSheets: 5,
  },
  postage: {
    id: PostageId("ECONOMY"),
    size: "STANDARD",
    deliveryDays: 3,
  },
  assembly: {
    envelopeId: EnvelopeId("envelope-nhs-c5-economy"),
    printColour: "BLACK",
  },
};

const bauStandardC4: PackSpecification = {
  id: PackSpecificationId("bau-standard-c4"),
  name: "BAU Standard Letter C4",
  status: "PROD",
  version: 1,
  createdAt: "2023-01-01T00:00:00Z",
  updatedAt: "2023-01-01T00:00:00Z",
  constraints: {
    maxSheets: 20,
  },
  postage: {
    id: PostageId("ECONOMY"),
    size: "LARGE",
    deliveryDays: 3,
  },
  assembly: {
    envelopeId: EnvelopeId("envelope-nhs-c4-economy"),
    printColour: "BLACK",
  },
};

const braille: PackSpecification = {
  id: PackSpecificationId("braille"),
  name: "Braille Letter",
  status: "PROD",
  version: 1,
  createdAt: "2023-01-01T00:00:00Z",
  updatedAt: "2023-01-01T00:00:00Z",
  constraints: {
    maxSheets: 5,
  },
  postage: {
    id: PostageId("ARTICLES_BLIND"),
    size: "STANDARD",
  },
  assembly: {
    features: ["BRAILLE"],
    printColour: "BLACK",
  },
};

const audio: PackSpecification = {
  id: PackSpecificationId("audio"),
  name: "Audio Letter",
  status: "PROD",
  version: 1,
  createdAt: "2023-01-01T00:00:00Z",
  updatedAt: "2023-01-01T00:00:00Z",
  constraints: {
    maxSheets: 5,
  },
  postage: {
    id: PostageId("ARTICLES_BLIND"),
    size: "STANDARD",
  },
  assembly: {
    features: ["AUDIO"],
    printColour: "BLACK",
  },
};

const sameDay: PackSpecification = {
  id: PackSpecificationId("same-day"),
  name: "Same Day Letter",
  status: "PROD",
  version: 1,
  createdAt: "2023-01-01T00:00:00Z",
  updatedAt: "2023-01-01T00:00:00Z",
  constraints: {
    maxSheets: 5,
  },
  postage: {
    id: PostageId("FIRST"),
    size: "LARGE",
    deliveryDays: 1,
  },
  assembly: {
    envelopeId: EnvelopeId("envelope-nhs-c4-same-day"),
    printColour: "COLOUR",
  },
};

const clientPack1: PackSpecification = {
  id: PackSpecificationId("client1-campaign1"),
  name: "Client1 Letter Pack 1",
  status: "PROD",
  version: 1,
  createdAt: "2023-01-01T00:00:00Z",
  updatedAt: "2023-01-01T00:00:00Z",
  constraints: {
    maxSheets: 4,
  },
  postage: {
    id: PostageId("ADMAIL"),
    size: "STANDARD",
    deliveryDays: 3,
  },
  assembly: {
    envelopeId: EnvelopeId("client1-envelope1-c5"),
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
    id: LetterVariantId("bau-standard"),
    name: "BAU Standard Letter",
    description: "BAU Standard Letter",
    volumeGroupId: VolumeGroupId("volume-group-12345"),
    packSpecificationIds: [bauStandardC5.id, bauStandardC4.id],
    type: "STANDARD",
    status: "PROD",
    constraints: {
      maxSheets: 20,
      deliveryDays: 3,
    },
  },
  braille: {
    id: LetterVariantId("braille"),
    name: "Braille Letter",
    description: "Braille Letter",
    volumeGroupId: VolumeGroupId("volume-group-12345"),
    packSpecificationIds: [braille.id],
    type: "BRAILLE",
    status: "PROD",
    constraints: {
      maxSheets: 5,
      deliveryDays: 3,
    },
  },
  audio: {
    id: LetterVariantId("audio"),
    name: "Audio Letter",
    description: "Audio Letter",
    volumeGroupId: VolumeGroupId("volume-group-12345"),
    packSpecificationIds: [audio.id],
    type: "AUDIO",
    status: "PROD",
    constraints: {
      maxSheets: 5,
      deliveryDays: 3,
    },
  },
  sameDay: {
    id: LetterVariantId("same-day"),
    name: "Same Day Letter",
    description: "Same Day Letter",
    volumeGroupId: VolumeGroupId("volume-group-12345"),
    packSpecificationIds: [sameDay.id],
    type: "STANDARD",
    status: "PROD",
    constraints: {
      maxSheets: 5,
      deliveryDays: 1,
    },
  },
  campaign1: {
    id: LetterVariantId("client1"),
    name: "Client 1 Letter Variant 1",
    description: "Client 1 Letter Variant 1",
    volumeGroupId: VolumeGroupId("volume-group-campaign1"),
    packSpecificationIds: [clientPack1.id],
    type: "STANDARD",
    status: "PROD",
    clientId: "client1",
    campaignIds: ["client1-campaign1"],
    constraints: {
      maxSheets: 4,
      deliveryDays: 3,
    },
  },
};

// eslint-disable-next-line no-console
console.log(JSON.stringify({ packs, variants }, null, 2));
