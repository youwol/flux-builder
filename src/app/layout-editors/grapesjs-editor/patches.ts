/** @format */

export function applyPatches(editor: any) {
    /** the default move command is patched such that it is allow to drag only  if
     * the dedicated 'move' icon is used. Mixing dragging inside the component w/ layout change + internal
     * component behavior was causing problem
     */
    const defaultMove = editor.Commands.get('tlb-move')
    editor.Commands.add('tlb-move', {
        run(ed: any, sender: any, opts: any = {}) {
            /* If the dedicated icon is used => opts["event"].target is not defined */
            if (opts && opts['event'] && opts['event'].target) {
                return
            }
            defaultMove.run(ed, sender, opts)
        },
    })

    /* --- Those next four lines are hacky, it ensure the attributes and styles panels are not displayed at first
    This problem seems to occur only for light workflow
    -----*/
    editor.Commands.run('show-attributes')
    editor.Commands.stop('show-attributes')
    editor.Commands.run('show-styles')
    editor.Commands.stop('show-styles')
    editor.Commands.run('show-traits')
    editor.Commands.stop('show-traits')
    editor.Commands.run('show-layers')
    editor.Commands.stop('show-layers')

    /* ---
    ---*/
    const buttons_container2 = document.getElementById(
        'panel__layout-devices-actions',
    ).children[0]
    buttons_container2.classList.add('d-flex', 'flex-wrap')
    const buttons_container3 = document.getElementById(
        'panel__render-panels-actions',
    ).children[0]
    buttons_container3.classList.add('d-flex', 'flex-wrap')
}
