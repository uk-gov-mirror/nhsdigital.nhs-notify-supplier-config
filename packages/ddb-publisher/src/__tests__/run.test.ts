import type {
  LoadedConfigStore,
  ValidationResult,
} from "@supplier-config/file-store";

import runPublisher from "packages/ddb-publisher/src/run";

jest.mock("@supplier-config/file-store", () => {
  return {
    loadConfigStore: jest.fn(),
    validateConfigStore: jest.fn(),
  };
});

jest.mock("../ddb/audit", () => {
  return {
    auditBeforeLoad: jest.fn(),
  };
});

jest.mock("../ddb/publish", () => {
  return {
    publishRecords: jest.fn(),
  };
});

jest.mock("@aws-sdk/client-dynamodb", () => {
  return {
    DynamoDBClient: jest.fn(() => ({})),
  };
});

jest.mock("@aws-sdk/lib-dynamodb", () => {
  return {
    DynamoDBDocumentClient: {
      from: jest.fn(() => ({ send: jest.fn() })),
    },
  };
});

const fileStore = jest.requireMock(
  "@supplier-config/file-store",
) as unknown as {
  loadConfigStore: jest.Mock;
  validateConfigStore: jest.Mock;
};

const audit = jest.requireMock("../ddb/audit") as unknown as {
  auditBeforeLoad: jest.Mock;
};

const publish = jest.requireMock("../ddb/publish") as unknown as {
  publishRecords: jest.Mock;
};

const awsClient = jest.requireMock("@aws-sdk/client-dynamodb") as unknown as {
  DynamoDBClient: jest.Mock;
};

describe("runPublisher", () => {
  it("should stop after validation when dryRun=true", async () => {
    const store: LoadedConfigStore = { rootPath: "/tmp", records: [] };
    fileStore.loadConfigStore.mockResolvedValue(store);

    const validation: ValidationResult = { ok: true, issues: [] };
    fileStore.validateConfigStore.mockReturnValue(validation);

    await runPublisher({
      sourcePath: "/tmp",
      env: "draft",
      tableName: "tbl",
      dryRun: true,
      force: false,
    });

    expect(audit.auditBeforeLoad).not.toHaveBeenCalled();
    expect(publish.publishRecords).not.toHaveBeenCalled();
  });

  it("should throw with a helpful message when validation fails", async () => {
    const store: LoadedConfigStore = {
      rootPath: "/tmp",
      records: [],
    };
    fileStore.loadConfigStore.mockResolvedValue(store);

    fileStore.validateConfigStore.mockReturnValue({
      ok: false,
      issues: [
        {
          entity: "supplier",
          sourceFilePath: "/tmp/supplier/1.json",
          message: "bad",
          path: ["a", 0],
        },
      ],
    });

    await expect(
      runPublisher({
        sourcePath: "/tmp",
        env: "draft",
        tableName: "tbl",
        dryRun: true,
        force: false,
      }),
    ).rejects.toThrow("Config store validation failed");
  });

  it("should block upload when audit reports blocking items and force=false", async () => {
    const store: LoadedConfigStore = {
      rootPath: "/tmp",
      records: [],
    };
    fileStore.loadConfigStore.mockResolvedValue(store);
    fileStore.validateConfigStore.mockReturnValue({ ok: true, issues: [] });

    audit.auditBeforeLoad.mockResolvedValue({
      blockingRecords: [
        { pk: "ENTITY#supplier", sk: "ID#1", status: "ACTIVE" },
      ],
    });

    await expect(
      runPublisher({
        sourcePath: "/tmp",
        env: "draft",
        tableName: "tbl",
        dryRun: false,
        force: false,
      }),
    ).rejects.toThrow("Upload blocked");

    expect(publish.publishRecords).not.toHaveBeenCalled();
  });

  it("should publish when audit reports blocking items but force=true", async () => {
    const store: LoadedConfigStore = {
      rootPath: "/tmp",
      records: [],
    };
    fileStore.loadConfigStore.mockResolvedValue(store);
    fileStore.validateConfigStore.mockReturnValue({ ok: true, issues: [] });

    audit.auditBeforeLoad.mockResolvedValue({
      blockingRecords: [
        { pk: "ENTITY#supplier", sk: "ID#1", status: "ACTIVE" },
      ],
    });

    await runPublisher({
      sourcePath: "/tmp",
      env: "draft",
      tableName: "tbl",
      dryRun: false,
      force: true,
    });

    expect(publish.publishRecords).toHaveBeenCalledTimes(1);
  });

  it("should publish when audit reports no blocking items", async () => {
    const store: LoadedConfigStore = {
      rootPath: "/tmp",
      records: [],
    };
    fileStore.loadConfigStore.mockResolvedValue(store);
    fileStore.validateConfigStore.mockReturnValue({ ok: true, issues: [] });

    audit.auditBeforeLoad.mockResolvedValue({
      blockingRecords: [],
    });

    await runPublisher({
      sourcePath: "/tmp",
      env: "draft",
      tableName: "tbl",
      dryRun: false,
      force: false,
    });

    expect(publish.publishRecords).toHaveBeenCalledTimes(1);
  });

  it("should log entity summary when records are loaded", async () => {
    const writeSpy = jest
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);

    const store: LoadedConfigStore = {
      rootPath: "/tmp",
      records: [
        {
          entity: "supplier",
          sourceFilePath: "/tmp/supplier/1.json",
          id: "1",
          data: {},
        },
        {
          entity: "supplier-pack",
          sourceFilePath: "/tmp/supplier-pack/1.json",
          id: "1",
          data: {},
        },
        {
          entity: "supplier",
          sourceFilePath: "/tmp/supplier/2.json",
          id: "2",
          data: {},
        },
      ],
    };

    fileStore.loadConfigStore.mockResolvedValue(store);
    fileStore.validateConfigStore.mockReturnValue({ ok: true, issues: [] });

    await runPublisher({
      sourcePath: "/tmp",
      env: "draft",
      tableName: "tbl",
      dryRun: true,
      force: false,
    });

    const logOutput = writeSpy.mock.calls
      .map(([msg]) => String(msg))
      .join("\n");
    expect(logOutput).toContain(
      "Loaded 3 records (supplier=2, supplier-pack=1).\n",
    );

    writeSpy.mockRestore();
  });

  it("should pass custom endpoint to DynamoDB client when env override is set", async () => {
    const store: LoadedConfigStore = {
      rootPath: "/tmp",
      records: [],
    };

    fileStore.loadConfigStore.mockResolvedValue(store);
    fileStore.validateConfigStore.mockReturnValue({ ok: true, issues: [] });
    audit.auditBeforeLoad.mockResolvedValue({ blockingRecords: [] });

    const originalAwsRegion = process.env.AWS_REGION;
    const originalAwsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const originalAwsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    process.env.SUPPLIER_CONFIG_DDB_ENDPOINT_URL = "http://127.0.0.1:8000";
    delete process.env.AWS_REGION;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;

    try {
      await runPublisher({
        sourcePath: "/tmp",
        env: "draft",
        tableName: "tbl",
        dryRun: false,
        force: false,
      });

      expect(awsClient.DynamoDBClient).toHaveBeenCalledWith({
        endpoint: "http://127.0.0.1:8000",
        region: "eu-west-2",
        credentials: {
          accessKeyId: "fakeMyKeyId",
          secretAccessKey: "fakeSecretAccessKey",
        },
      });
    } finally {
      delete process.env.SUPPLIER_CONFIG_DDB_ENDPOINT_URL;

      if (originalAwsRegion === undefined) {
        delete process.env.AWS_REGION;
      } else {
        process.env.AWS_REGION = originalAwsRegion;
      }

      if (originalAwsAccessKeyId === undefined) {
        delete process.env.AWS_ACCESS_KEY_ID;
      } else {
        process.env.AWS_ACCESS_KEY_ID = originalAwsAccessKeyId;
      }

      if (originalAwsSecretAccessKey === undefined) {
        delete process.env.AWS_SECRET_ACCESS_KEY;
      } else {
        process.env.AWS_SECRET_ACCESS_KEY = originalAwsSecretAccessKey;
      }
    }
  });

  it("should not inject fake credentials for non-local custom endpoints", async () => {
    const store: LoadedConfigStore = {
      rootPath: "/tmp",
      records: [],
    };

    fileStore.loadConfigStore.mockResolvedValue(store);
    fileStore.validateConfigStore.mockReturnValue({ ok: true, issues: [] });
    audit.auditBeforeLoad.mockResolvedValue({ blockingRecords: [] });

    process.env.SUPPLIER_CONFIG_DDB_ENDPOINT_URL =
      "https://dynamodb.eu-west-2.amazonaws.com";

    try {
      await runPublisher({
        sourcePath: "/tmp",
        env: "draft",
        tableName: "tbl",
        dryRun: false,
        force: false,
      });

      expect(awsClient.DynamoDBClient).toHaveBeenCalledWith({
        endpoint: "https://dynamodb.eu-west-2.amazonaws.com",
      });
    } finally {
      delete process.env.SUPPLIER_CONFIG_DDB_ENDPOINT_URL;
    }
  });

  it("should not inject fake credentials when the custom endpoint is not a valid URL", async () => {
    const store: LoadedConfigStore = {
      rootPath: "/tmp",
      records: [],
    };

    fileStore.loadConfigStore.mockResolvedValue(store);
    fileStore.validateConfigStore.mockReturnValue({ ok: true, issues: [] });
    audit.auditBeforeLoad.mockResolvedValue({ blockingRecords: [] });

    process.env.SUPPLIER_CONFIG_DDB_ENDPOINT_URL = "not-a-url";

    try {
      await runPublisher({
        sourcePath: "/tmp",
        env: "draft",
        tableName: "tbl",
        dryRun: false,
        force: false,
      });

      expect(awsClient.DynamoDBClient).toHaveBeenCalledWith({
        endpoint: "not-a-url",
      });
    } finally {
      delete process.env.SUPPLIER_CONFIG_DDB_ENDPOINT_URL;
    }
  });

  it("should include path in issue label only when path is non-empty", async () => {
    const store: LoadedConfigStore = { rootPath: "/tmp", records: [] };
    fileStore.loadConfigStore.mockResolvedValue(store);

    fileStore.validateConfigStore.mockReturnValue({
      ok: false,
      issues: [
        {
          entity: "supplier",
          sourceFilePath: "/tmp/supplier/1.json",
          message: "bad",
          path: [],
        },
      ],
    });

    await expect(
      runPublisher({
        sourcePath: "/tmp",
        env: "draft",
        tableName: "tbl",
        dryRun: true,
        force: false,
      }),
    ).rejects.toThrow("supplier /tmp/supplier/1.json - bad");
  });

  it("should use <missing> label when audit record status is undefined", async () => {
    const store: LoadedConfigStore = { rootPath: "/tmp", records: [] };
    fileStore.loadConfigStore.mockResolvedValue(store);
    fileStore.validateConfigStore.mockReturnValue({ ok: true, issues: [] });

    audit.auditBeforeLoad.mockResolvedValue({
      blockingRecords: [{ pk: "ENTITY#supplier", sk: "ID#1" }],
    });

    await expect(
      runPublisher({
        sourcePath: "/tmp",
        env: "draft",
        tableName: "tbl",
        dryRun: false,
        force: false,
      }),
    ).rejects.toThrow("status=<missing>");
  });

  it("should use explicit AWS env values for local DynamoDB endpoints when provided", async () => {
    const store: LoadedConfigStore = {
      rootPath: "/tmp",
      records: [],
    };

    fileStore.loadConfigStore.mockResolvedValue(store);
    fileStore.validateConfigStore.mockReturnValue({ ok: true, issues: [] });
    audit.auditBeforeLoad.mockResolvedValue({ blockingRecords: [] });

    process.env.SUPPLIER_CONFIG_DDB_ENDPOINT_URL = "http://localhost:8000";
    process.env.AWS_REGION = "eu-central-1";
    process.env.AWS_ACCESS_KEY_ID = "customKey";
    process.env.AWS_SECRET_ACCESS_KEY = "customSecret";

    try {
      await runPublisher({
        sourcePath: "/tmp",
        env: "draft",
        tableName: "tbl",
        dryRun: false,
        force: false,
      });

      expect(awsClient.DynamoDBClient).toHaveBeenCalledWith({
        endpoint: "http://localhost:8000",
        region: "eu-central-1",
        credentials: {
          accessKeyId: "customKey",
          secretAccessKey: "customSecret",
        },
      });
    } finally {
      delete process.env.SUPPLIER_CONFIG_DDB_ENDPOINT_URL;
      delete process.env.AWS_REGION;
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;
    }
  });
});
