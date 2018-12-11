const util = require('../util')
const {
    ast,
    extend,
    getStaticStyleObject
} = util

function getLinesStaticStyle(n) {
    return {
        overflow: 'hidden',
        'text-overflow': 'ellipsis',
        '-webkit-line-clamp': `${n}`
    }
}

exports.processLines = function (el) {
    const tag = el._origTag || el.tag
    if (
        this.config.preservedTags.indexOf(tag) > -1
        && tag !== 'text') {
        return
    }
    const staticStyle = getStaticStyleObject(el)
    const n = parseInt(staticStyle.lines)
    if (n > 0 && !isNaN(n)) {
        extend(staticStyle, getLinesStaticStyle(n))
        el.staticStyle = JSON.stringify(staticStyle)
    }
};

exports.processText = function (
    el,
    attrsMap,
    attrsList,
    attrs,
    staticClass
) {
    const finalClass = staticClass + ' weex-el weex-text'
    el.staticClass = `"${finalClass}"`;
    attrs.push({
        name: `weex-type`,
        value: '"text"'
    });


    //处理 <text value='12'></text> 或 <text :value='12'/></text>
    let value = attrsMap.value || attrsMap[":value"];
    if (value) {
        if (attrsMap.value) {
            el.children.push({
                type: 3,
                text: value
            });
        } else {
            el.children.push({
                type: 2,
                expression: '_s(' + value + ')',
                // tokens: [[Object]],
                text: '{{' + value + '}}'
            });
        }

        let i = -1;
        let b = attrs.some(function (item, index) {
            i = index;
            return item.name.endsWith("value");
        });
        //移除 value属性 避免多余的渲染
        if (b) {
            attrs.splice(i, 1);
        }
    }


    delete el.ns;
    el.plain = false
};

// deal with binding-styles ast node.
exports.compile = function (objNode, px2remTags, rootValue, transformNode) {
    const props = objNode.properties
    let hasLines = false
    for (let i = 0, l = props.length; i < l; i++) {
        const propNode = props[i]
        const keyNode = propNode.key
        const keyType = keyNode.type
        const keyNodeValStr = keyType === 'Literal' ? 'value' : 'name'
        const keyName = keyNode[keyNodeValStr]
        const valNode = propNode.value
        if (keyName === 'lines') {
            hasLines = true
            keyNode[keyNodeValStr] = 'webkitLineClamp'
        }
        else if (px2remTags.indexOf(keyName) > -1) {
            propNode.value = transformNode(propNode.value, 'text', rootValue, true/*asPropValue*/)
        }
    }
    if (hasLines) {
        objNode.properties = props.concat([
            ast.genPropNode('overflow', 'hidden'),
            ast.genPropNode('textOverflow', 'ellipsis')
        ])
    }
    return objNode
}
