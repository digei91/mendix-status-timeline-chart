const base = require("@mendix/pluggable-widgets-tools/configs/prettier.base.json");

module.exports = {
    ...base,
    plugins: [require.resolve("@prettier/plugin-xml")],
    // Studio Pro shows line breaks inside captions/descriptions literally, so never wrap XML text
    overrides: [{ files: "*.xml", options: { printWidth: 1000 } }]
};
