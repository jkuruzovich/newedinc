(function(exports) {

  var focusClass = 'combo-box_option_focus';

  exports.ComboBox = document.registerElement('combo-box', {
    prototype: Object.create(
      HTMLElement.prototype,
      {
        createdCallback: {value: function() {
        }},

        attachedCallback: {value: function() {
          this.__input = this.querySelector('.combo-box_search, input[type="text"]');
          if (!this.__input) {
            return console.warn('no input found in <combo-box>');
          }

          this.__list = this.querySelector('.combo-box_options');
          if (!this.__list) {
            return console.warn('no list found in <combo-box>');
          }
          hide(this.__list);

          this.__list.addEventListener('click', this.__onclick = onclick.bind(this));

          this.__input.addEventListener('focus', this.__onfocus = onfocus.bind(this));
          this.__input.addEventListener('keydown', this.__onkeydown = onkeydown.bind(this));
          this.__input.addEventListener('blur', this.__onfocus = onblur.bind(this));
        }},

        attributeChangedCallback: {value: function(attr, oldValue, newValue) {
        }},

        detachedCallback: {value: function() {
          this.__list.removeEventListener('click', this.__onclick);

          this.__input.removeEventListener('focus', this.__onfocus);
          this.__input.removeEventListener('keydown', this.__onkeydown);
          this.__input.removeEventListener('blur', this.__onfocus);
        }}
      }
    )
  });

  function onfocus(e) {
    show(this.__list);
    updateVisibleOptions(this);
    cancelHide(this);
  }

  function onkeydown(e) {
    // console.log('key:', e.keyCode);
    switch (e.keyCode) {

      case 13: // enter
        toggleFocused(this);
        e.preventDefault();
        var form = this.__input.form;
        var onsubmit = function(e) {
          console.warn('cancelling submission');
          form.removeEventListener('submit', onsubmit);
          e.preventDefault();
          return false;
        };
        form.addEventListener('submit', onsubmit);
        return false;

      case 40: // down arrow
        e.preventDefault();
        moveDown(this);
        return false;
        
      case 38: // up arrow
        e.preventDefault();
        moveUp(this);
        return false;

      case 27: // escape
        this.__input.value = '';
        break;
    }

    clearTimeout(this.__updateTimeout);
    var root = this;
    this.__updateTimeout = setTimeout(function() {
      updateVisibleOptions(root);
    }, 20);
  }

  function onclick(e) {
    this.__input.focus();
    selectAll(this.__input);
    cancelHide(this);
  }

  function onblur(e) {
    var list = this.__list;
    this.__hideTimeout = setTimeout(function() {
      hide(list);
    }, 100);
  }

  function cancelHide(el) {
    clearTimeout(el.__hideTimeout);
  }

  function show(el) {
    el.style.removeProperty('display');
  }

  function hide(el) {
    el.style.setProperty('display', 'none');
  }

  function getFocused(root) {
    return root.querySelector('.' + focusClass);
  }

  function toggleFocused(root) {
    var focused = getFocused(root);
    if (focused) {
      var input = focused.querySelector('input');
      input.checked = !input.checked;
      return input.checked;
    }
    return null;
  }

  function updateVisibleOptions(root) {
    var value = root.__input.value;
    var matches = function(text) {
      // console.log('match "%s" with "%s"', value, text);
      return text.toLowerCase().indexOf(value) > -1;
    };

    var options = getOptions(root);
    var focused = false;
    var visible = options
      .filter(function(option, i) {
        var input = option.querySelector('input');
        var text = input.value;
        var labelSelector = '.combo-box_label';
        if (input.id) {
          labelSelector += ', [for="' + input.id + '"]';
        }
        var label = option.querySelector(labelSelector);
        if (label) {
          if (label.hasAttribute('data-text')) {
            text = label.getAttribute('data-text');
          } else {
            label.setAttribute('data-text', text = label.textContent);
          }
        }
        var visible = value && text
          ? matches(text)
          : true;
        if (visible) {
          show(option);
          if (label) {
            var index = text.toLowerCase().indexOf(value);
            label.innerHTML = [
              text.substr(0, index),
              '<u>',
              text.substr(index, value.length),
              '</u>',
              text.substr(index + value.length)
            ].join('');
          }
        } else {
          hide(option);
          if (label) label.textContent = text;
        }
        var focus = visible && !focused;
        option.classList.toggle(focusClass, focus);
        if (focus) focused = focus;
        return visible;
      });
    // console.log('%d of %d options visible', visible.length, options.length);
  }

  function moveUp(root) {
    var focused = getFocused(root);
    return move(focused, true);
  }

  function moveDown(root) {
    var focused = getFocused(root);
    return move(focused, false);
  }

  function move(node, up) {
    console.log('move', node, up);
    var original = node;
    var prop = up ? 'previousSibling' : 'nextSibling';
    while (node = node[prop]) {
      if (node.nodeType === 1 && isVisible(node)) {
        break;
      }
    }

    if (node && node !== original) {
      original.classList.remove(focusClass);
      node.classList.add(focusClass);
      scrollTo(node);
      return true;
    }
    return node;
  }

  function isVisible(el) {
    return el.style.getPropertyValue('display') !== 'none';
  }

  function scrollTo(node) {
    var parent = node.parentNode;
    var outer = parent.getBoundingClientRect();
    var inner = node.getBoundingClientRect();
    var top = inner.top - outer.top;
    console.log('top:', top, 'scrollTop:', parent.scrollTop);
    if (inner.bottom > outer.bottom) {
      console.warn('out of bounds (below)');
      parent.scrollTop += inner.bottom - outer.bottom;
    } else if (inner.top < outer.top) {
      console.warn('out of bounds (above)');
      parent.scrollTop -= outer.top - inner.top;
    }
  }

  function selectAll(input) {
    if (typeof input.select === 'function') {
      input.select();
    }
    if (typeof input.setSelectionRange === 'function') {
      input.setSelectionRange(0, input.value.length);
    }
  }

  function getOptions(root) {
    return [].slice.call(
      root.querySelectorAll('.combo-box_option')
    );
  }

})(this);
