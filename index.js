const moleculer = require("moleculer");
const fs = require('fs');
const path = require("path");
const brokerOne = new moleculer.ServiceBroker({ transporter: 'nats://localhost:4222', disableBalancer: true, nodeID: 'broker-one'});
const brokerTwo = new moleculer.ServiceBroker({ transporter: 'nats://localhost:4222', disableBalancer: true, nodeID: 'broker-two' });
const brokerThree = new moleculer.ServiceBroker({ transporter: 'nats://localhost:4222', disableBalancer: true, nodeID: 'broker-three' });
const bar = {
    version: 1,
    name: "bar",
    dependencies: [],
    actions: {
        save(ctx) {
            this.logger.info("file received.");
            const s = fs.createWriteStream(path.resolve("sample-parsed.pdf"));
            ctx.params.pipe(s);
            this.logger.info("file saved.");
        }
    },
};
const foo = {
    version: 1,
    name: "foo",
    dependencies: [],
    actions: {
        async send(ctx) {
            this.logger.info("reading file...");
            const stream = fs.createReadStream(path.resolve("sample.pdf"));
            this.logger.info("file to stream completed.");
            await ctx.call("v1.bar.save", stream, { meta: { filename: "sample.pdf", token: "SAMPLE SAMPLE SAMPLE" }});
            this.logger.info("stream sent.");
        }
    },
}
brokerOne.createService(bar);
brokerTwo.createService(bar);
brokerThree.createService(foo);

brokerOne.start()
    .then(() => brokerTwo.start())
    .then(() => brokerThree.start())
    .then(() => brokerOne.waitForServices([{ version: 1, name: "bar" }, { version: 1, name: "foo" }]))
    .then(() => brokerTwo.waitForServices([{ version: 1, name: "bar" }, { version: 1, name: "foo" }]))
    .then(() => brokerThree.waitForServices([{ version: 1, name: "bar" }, { version: 1, name: "foo" }]))
    .then(() => brokerThree.call("v1.foo.send"));