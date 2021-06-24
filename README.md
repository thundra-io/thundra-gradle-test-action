# thundra-gradle-test-action

A GitHub Action to instrument your Gradle with Thundra Agent.

## Usage

Information about available parameters is listed [below](#parameters). The only required parameter is the Thundra API Key, which can be obtained from [here]().

You can learn more about Thundra at [thundra.io](https://thundra.io)

Once you get the Thundra API Key, make sure to set it as a secret. A sample Github Action workflow would look like this:

### Usage

```yaml
# ...

steps:
  - uses: actions/checkout@v2
  - name: Set up JDK 1.8
    uses: actions/setup-java@v1
    with:
      java-version: 1.8
  - name: Thundra Gradle Test Instrumentation
    uses: thundra-io/thundra-gradle-test-action@v1
    with:
      apikey: ${{ secrets.THUNDRA_APIKEY }}
      command: ./gradlew build
```

### Manual Usage

If you plan to run your tests manually, you must give the `./thundra.gradle` file as the init script to your command. The path of this file is also exported to the `THUNDRA_GRADLE_INIT_SCRIPT_PATH` environment variable in the action, so you can use it that way too.

```yaml
# ...

steps:
  - uses: actions/checkout@v2
  - name: Set up JDK 1.8
    uses: actions/setup-java@v1
    with:
      java-version: 1.8
  - name: Thundra Gradle Test Instrumentation
    uses: thundra-io/thundra-gradle-test-action@v1
    with:
      apikey: ${{ secrets.THUNDRA_APIKEY }}
  - name: Run Gradle command
    run: ./gradlew build --init-script ./thundra.gradle
```

## Parameters

| Name                  | Requirement       | Description
| ---                   | ---               | ---
| apikey                | Required          | Thundra API Key
| command               | Optional          | The Gradle command you want to run. The given command will be executed with the instrumentation init script. However, if it's not present, the action will end once the instrumentation init script is generated. This is optional in case you want to do more before you actually run your tests. See the [Manual Usage](#manual-usage) for more.
| project_id            | Optional          | Your project id from Thundra. Will be used to filter and classify your testruns.
| plugin_version        | Optional          | In the action itself, we use a Gradle plugin to run your tests. This plugin is released and versioned separately from the action. Hence, if there is some breaking change or specific version you want to use, you can use it by defining this parameter. You can see all the available version of our plugin [here](https://search.maven.org/artifact/io.thundra.agent/thundra-agent-gradle-test-instrumentation).
| agent_version         | Optional          | A specific version Thundra Java Agent you want to use should be defined here. Similar to `plugin_version` parameter. You can see all the available version of our agent [here]().
