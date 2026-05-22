/**
 * Rehype plugin: converts the markdown pattern
 *   ![alt](src)
 *
 *   *caption text*
 * into semantic <figure><img><figcaption>caption text</figcaption></figure>.
 *
 * Matches a <p> whose only element child is an <img>, immediately followed
 * by a <p> whose only element child is an <em>. The two <p>s are replaced
 * by a single <figure>; the <em>'s children become the <figcaption>'s children.
 */
export default function rehypeFigureCaption() {
  return (tree) => {
    const onlyElementChild = (node) => {
      if (!node || node.type !== 'element') return null;
      const elementChildren = (node.children || []).filter(
        (c) => c.type === 'element'
      );
      if (elementChildren.length !== 1) return null;
      // Disallow non-whitespace text alongside the single element.
      const hasMeaningfulText = (node.children || []).some(
        (c) => c.type === 'text' && c.value.trim() !== ''
      );
      if (hasMeaningfulText) return null;
      return elementChildren[0];
    };

    const findNextElementIndex = (arr, fromIndex) => {
      for (let j = fromIndex; j < arr.length; j++) {
        const c = arr[j];
        if (c.type === 'element') return j;
        if (c.type === 'text' && c.value.trim() === '') continue;
        return -1;
      }
      return -1;
    };

    const transformChildren = (parent) => {
      const children = parent.children || [];
      const next = [];
      for (let i = 0; i < children.length; i++) {
        const node = children[i];
        if (node.type === 'element' && node.tagName === 'p') {
          const img = onlyElementChild(node);
          if (img && img.tagName === 'img') {
            const siblingIdx = findNextElementIndex(children, i + 1);
            const sibling = siblingIdx >= 0 ? children[siblingIdx] : null;
            const em = sibling ? onlyElementChild(sibling) : null;
            if (
              sibling &&
              sibling.tagName === 'p' &&
              em &&
              em.tagName === 'em'
            ) {
              next.push({
                type: 'element',
                tagName: 'figure',
                properties: {},
                children: [
                  img,
                  {
                    type: 'element',
                    tagName: 'figcaption',
                    properties: {},
                    children: em.children,
                  },
                ],
              });
              i = siblingIdx;
              continue;
            }
          }
        }
        if (node.type === 'element') transformChildren(node);
        next.push(node);
      }
      parent.children = next;
    };

    transformChildren(tree);
  };
}
