import Ember from 'ember';
import { moduleFor, test } from 'ember-qunit';
import Base from 'ember-validations/validators/base';
import wait from 'ember-test-helpers/wait';

let model;
let Model;
let CustomValidator;
let validator;

const {
  Object: EmberObject,
  get,
  run,
  run: { later }
} = Ember;

moduleFor('object:model', 'Base Validator', {
  integration: true,
  beforeEach() {
    Model = EmberObject.extend({
      dependentValidationKeys: {}
    });
    CustomValidator = Base.extend({
      init() {
        this._super();
        this.dependentValidationKeys.pushObject('otherAttribute');
      },
      call() {
      }
    });

    this.registry.register('object:model', Model);
    run(() => model = this.subject());
  }
});

test('when value is not empty', function(assert) {
  run(() => validator = CustomValidator.create({ model, property: 'attribute' }));
  assert.equal(get(validator, 'isValid'), true);
});

test('validator has isInvalid flag', function(assert) {
  run(() => validator = CustomValidator.create({ model, property: 'attribute' }));
  assert.equal(get(validator, 'isInvalid'), false);
});

test('generates dependentValidationKeys on the model', function(assert) {
  run(() => validator = CustomValidator.create({ model, property: 'attribute' }));
  assert.deepEqual(get(model, 'dependentValidationKeys'), { attribute: ['otherAttribute'] });
});

test('inactive validators should be considered valid', function(assert) {
  let canValidate = true;
  run(() => {
    validator = CustomValidator.create({
      model,
      property: 'attribute',
      canValidate() {
        return canValidate;
      },
      call() {
        this.errors.pushObject('nope');
      }
    });
  });
  assert.equal(get(validator, 'isValid'), false);
  canValidate = false;
  run(validator, 'validate');
  assert.equal(get(validator, 'isValid'), true);
});

test('promise returning that model is invalid should work', function(assert) {
  assert.equal(get(validator, 'isValid'), true);
  run(() => {
    validator = CustomValidator.create({
      model,
      property: 'attribute',
      canValidate() {
        return true;
      },
      call() {
        // return Promise.resolve().then(() => {
        //   this.errors.pushObject('nope');
        // });
        return new Promise((resolve) => {
          later(() => {
            this.errors.pushObject('nope');
            resolve();
          }, 1000);
        });
      }
    });
    validator.validate().then(() => {
      assert.equal(get(validator, 'isValid'), false);
    });
  });
  assert.equal(get(validator, 'isValid'), false);
  return wait().then(() => {
    assert.equal(get(validator, 'isValid'), false);
  });
});

test('promise returning that model is valid should work', function(assert) {
  run(() => {
    validator = CustomValidator.create({
      model,
      property: 'attribute',
      canValidate() {
        return true;
      },
      call() {
        return new Promise((resolve) => {
          later(() => {
            resolve();
          }, 1000);
        });
      }
    });
    validator.validate().then(() => {
      assert.equal(get(validator, 'isValid'), true);
    });
  });
  assert.equal(get(validator, 'isValid'), false);
  return wait().then(() => {
    assert.equal(get(validator, 'isValid'), true);
  });
});
