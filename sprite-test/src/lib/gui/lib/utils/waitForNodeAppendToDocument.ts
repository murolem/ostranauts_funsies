export type NodeAppendToDocumentCallback<T extends Node> = (node: T) => void

let observer: MutationObserver | null = null;
const cbs: {
    cb: NodeAppendToDocumentCallback<any>,
    node: Node
}[] = [];

/**
 * Listens for element additions to the document, calling a callback once a given node is added.
 */
export function waitForNodeAppendToDocument<T extends Node>(node: T, cb: NodeAppendToDocumentCallback<T>): void {
    if (observer === null) {
        observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                for (var i = 0; i < mutation.addedNodes.length; i++) {
                    const addedNode = mutation.addedNodes[i];
                    const cbIndex = cbs.findIndex(cb => cb.node === addedNode);
                    if (cbIndex !== -1) {
                        cbs[cbIndex].cb(addedNode);
                        delete cbs[cbIndex];
                    }

                }
            })
        });

        observer.observe(document, {
            subtree: true,
            childList: true,
        });
    }

    cbs.push({
        cb,
        node
    });
}