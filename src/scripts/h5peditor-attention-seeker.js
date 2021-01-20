/** Class for AttentionSeeker H5P widget */
class EditorAttentionSeeker {

  /**
   * @constructor
   * @param {object} parent Parent element in semantics.
   * @param {object} field Semantics field properties.
   * @param {object} params Parameters entered in editor form.
   * @param {function} setValue Callback to set parameters.
   */
  constructor(parent, field, params, setValue) {
    this.parent = parent;
    this.field = field;
    this.params = params;
    this.setValue = setValue;

    this.field.attentionseeker = this.field.attentionseeker || {};

    // Callbacks to call when parameters change
    this.changes = [];

    // Let parent handle ready callbacks of children
    this.passReadies = true;

    // DOM
    this.$container = H5P.jQuery('<div>', {
      class: 'h5peditor-attentionseeker'
    });

    // Instantiate original field (or create your own and call setValue)
    this.fieldInstance = new H5PEditor.widgets[this.field.type](this.parent, this.field, this.params, this.setValue);
    this.fieldInstance.appendTo(this.$container);

    const preview = this.buildPreview();
    this.fieldInstance.$content.prepend(preview);

    this.attentionSeeker = new H5P.AttentionSeeker();

    this.animationParams = {
      style: 'none',
      interval: 3000,
      repeat: Infinity
    };

    this.optionFields = {};

    this.optionFields.style = H5PEditor.findField(this.field.attentionseeker.style, this.fieldInstance);
    if (this.optionFields.style) {
      this.animationParams.style = this.optionFields.style.value;
      this.optionFields.style.changes.push((value) => {
        this.startPreviewAnimation({style: value});
      });
    }

    this.optionFields.interval = H5PEditor.findField(this.field.attentionseeker.interval, this.fieldInstance);
    if (this.optionFields.interval) {
      this.animationParams.interval = this.optionFields.interval.value * 1000;

      ['keydown', 'blur', 'paste'].forEach(listenerType => {
        this.optionFields.interval.$input.get(0).addEventListener(listenerType, event => {
          this.handleFieldUpdate('interval', event);
        });
      });
    }

    this.optionFields.repeat = H5PEditor.findField(this.field.attentionseeker.repeat, this.fieldInstance);
    if (this.optionFields.repeat) {
      this.animationParams.repeat = this.optionFields.repeat.value;

      ['keydown', 'blur', 'paste'].forEach(listenerType => {
        this.optionFields.repeat.$input.get(0).addEventListener(listenerType, event => {
          this.handleFieldUpdate('repeat', event);
        });
      });
    }

    // Stop attention seeker when group collapsed
    this.fieldInstance.on('collapsed', () => {
      this.attentionSeeker.unregisterAll();
    });

    // Stop attention seeker when group expanded
    this.fieldInstance.on('expanded', () => {
      this.startPreviewAnimation(this.animationParams, true);
    });

    // Errors
    this.$errors = this.$container.find('.h5p-errors');

    // Start attention preview if expanded
    if (!this.fieldInstance.$group.get(0).classList.contains('expanded')) {
      this.startPreviewAnimation(this.animationParams, true);
    }
  }

  /**
   * Handle update of input field.
   * @param {string} fieldType Field's type.
   */
  handleFieldUpdate(fieldType, event) {
    if ((event.type === 'keydown' && event.key === 'Enter') || event.type === 'blur' || event.type === 'paste') {

      // field needs to update on paste first
      setTimeout(() => {
        const valueString = this.optionFields[fieldType].$input.val();
        let valueInt = parseInt(valueString);

        if (fieldType === 'interval') {
          valueInt *= 1000; // Make milliseconds
        }
        else if (fieldType === 'repeat' && valueString === '') {
          valueInt = Infinity; // don't stop animation
        }

        if (Number.isInteger(valueInt) || valueInt === Infinity) {
          const params = {};
          params[fieldType] = valueInt;

          if (params[fieldType] !== this.animationParams[fieldType]) {
            this.startPreviewAnimation(params);
          }
        }
      }, 0);
    }
  }

  /**
   * Start preview animation.
   * @param {object} [params] Parameters.
   * @param {string} [params.style] Style of animation.
   * @param {number} [params.interval] Interval.
   * @param {number} [params.repeat] Number of repetitions.
   */
  startPreviewAnimation(params) {
    params = params || {};

    if (params.style) {
      this.animationParams.style = params.style;
    }

    if (params.interval) {
      this.animationParams.interval = params.interval;
    }

    if (params.repeat) {
      this.animationParams.repeat = params.repeat;
    }

    this.attentionSeeker.unregisterAll();

    this.attentionSeeker.register({
      element: this.previewBallWrapper,
      style: this.animationParams.style,
      interval: this.animationParams.interval,
      repeat: this.animationParams.repeat,
      options: {
        runWorker: true
      }
    });
  }

  /**
   * Build preview.
   * @return {HTMLElement} preview.
   */
  buildPreview() {
    const preview = document.createElement('div');
    preview.classList.add('h5peditor-attentionseeker-preview');

    this.previewBallWrapper = document.createElement('div');
    this.previewBallWrapper.classList.add('h5peditor-attentionseeker-preview-ball-wrapper');
    preview.appendChild(this.previewBallWrapper);

    const previewBall = document.createElement('div');
    previewBall.classList.add('h5peditor-attentionseeker-preview-ball');
    this.previewBallWrapper.appendChild(previewBall);

    return preview;
  }

  /**
   * Append field to wrapper. Invoked by H5P core.
   * @param {H5P.jQuery} $wrapper Wrapper.
   */
  appendTo($wrapper) {
    this.$container.appendTo($wrapper);
  }

  /**
   * Validate current values. Invoked by H5P core.
   * @return {boolean} True, if current value is valid, else false.
   */
  validate() {
    return this.fieldInstance.validate();
  }

  /**
   * Remove self. Invoked by H5P core.
   */
  remove() {
    this.$container.remove();
  }
}
export default EditorAttentionSeeker;
