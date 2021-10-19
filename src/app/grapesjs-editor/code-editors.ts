import { replaceTemplateElements } from "./flux-rendering-components";


export function buildCodeEditor(editor, type) {
    var codeEditor = editor.CodeManager.getViewer('CodeMirror').clone();
    codeEditor.set({
      codeName: type === 'html' ? 'htmlmixed' : 'css',
      readOnly: false,
      theme: 'hopscotch',
      autoBeautify: true,
      autoCloseTags: true,
      autoCloseBrackets: true,
      styleActiveLine: true,
      smartIndent: true,
    });
    return codeEditor;
  }


function setupHtmlAutoUpdates(appStore, editor, htmlCodeEditor) {
    function update() {
      const htmlCode = htmlCodeEditor.editor.getValue()
      if (!htmlCode) {return;}
      editor.setComponents(htmlCode);
      replaceTemplateElements(appStore.project.workflow.modules.map(m => m.moduleId),editor,appStore)
      const style = Object.values(editor.fluxCache).reduce( (acc, cache: any)=> acc+" "+cache.styles, "")
      editor.getStyle().add(style)
    }
    var delay;
    htmlCodeEditor.editor.on('change', function() {
      clearTimeout(delay);
      delay = setTimeout(update, 300);
    });
    htmlCodeEditor.editor.refresh();
  }
  
  function setupCssAutoUpdates(editor, cssCodeEditor) {
    function update() {
      const cssCode = cssCodeEditor.editor.getValue()
      if (!cssCode) {return;}
      editor.setStyle(cssCode);
    }
    var delay;
    cssCodeEditor.editor.on('change', function() {
      clearTimeout(delay);
      delay = setTimeout(update, 300);
    });
  }

  
  
export function buildCodePanel(appStore, editor, panel) {
    const codePanel = document.createElement('div');
    codePanel.classList.add('code-panel');
  
    const htmlSection = document.createElement('section');
    const cssSection = document.createElement('section');
    htmlSection.innerHTML = '<div>HTML</div>'
    cssSection.innerHTML = '<div>CSS</div>'
  
    const htmlCodeEditor = buildCodeEditor(editor, 'html')
    const cssCodeEditor = buildCodeEditor(editor, 'css')
    const htmlTextArea = document.createElement('textarea');
    const cssTextArea = document.createElement('textarea');
    htmlSection.appendChild(htmlTextArea);
    cssSection.appendChild(cssTextArea);
  
    codePanel.appendChild(htmlSection);
    codePanel.appendChild(cssSection);
    panel.set('appendContent', codePanel).trigger('change:appendContent');
    htmlCodeEditor.init(htmlTextArea);
    cssCodeEditor.init(cssTextArea);
    htmlCodeEditor.setContent(editor.getHtml());
    cssCodeEditor.setContent(editor.getCss({ avoidProtected: true }));
  
    /*Split([htmlSection, cssSection], {
      direction: 'vertical',
      sizes: [50, 50],
      minSize: 100,
      gutterSize: 2,
      onDragEnd: () => {
        htmlCodeEditor.editor.refresh();
        cssCodeEditor.editor.refresh();
      }
    });
  */
    setupHtmlAutoUpdates(appStore, editor, htmlCodeEditor);
    setupCssAutoUpdates(editor, cssCodeEditor);
  
    // make sure editor is aware of width change after the 300ms effect ends
    setTimeout(() => {
      htmlCodeEditor.editor.refresh();
      cssCodeEditor.editor.refresh();
    }, 320)
  
    return codePanel
  }

  