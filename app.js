var validators = {
  required: function(value) {
    return !!value;
  },
  number: function(value) {
    return !(isNaN(parseInt(value)));
  },
  png: function(value) {
    if (value) {
      var extension = value.split(".");
      if (extension && extension.length > 1) {
        extension = extension[extension.length - 1].toUpperCase();
        return ["PNG"].indexOf(extension) !== -1;
      }
      return false;
    }
    return true;
  }
};

function findValidators(value) {
  if (typeof value === 'string') {
    return value.split(',');
  }
  return [];
}

/**
 * Validate a single HTML input field, if the field is invalid
 * it should append the `has-error` class to it's parent. 
 */
function validateField(field) {
  var isValid = findValidators(field.data('validate')).filter(function(validator) {
    if (typeof validators[validator] === 'function') {
      return !validators[validator](field.val());
    }
    return false;
  }).length === 0;

  if (isValid) {
    field.parent().parent().removeClass('has-error');
  } else {
    field.parent().parent().addClass('has-error');
  }
  field.data('valid', isValid);
}

function addTax(price) {
  var value = parseInt(price);
  if (!isNaN(value)) {
    return (value * 1.20).toFixed(2);
  }
  return '';
}

/**
 * Creates a bootstrap alert message, and removes it after 4s.
 * 
 * @param  {String} message
 * @param  {String} type
 */
function showAlert(message, type) {
  var element = $('<div>', {
    'class': 'alert alert-' + type,
    'html': '<p>' + message + '</p>'
  });
  $('.alerts').append(element);
  setTimeout(function() {
    element.remove();
  }, 4000);
}

// serialize data function
function objectifyForm(form) {
  var obj = {};
  var arr = $(form).serializeArray();
  for (var i = 0; i < arr.length; i++) {
    obj[arr[i].name] = arr[i].value;
  }
  return obj;
}

function formatDate(date) {
  if (!date) {
    return '';
  }
  return date.toLocaleString();
}

var id = 0;
var products = [];

/**
 * Adds a new product to a list of products by adding a
 * timestamp and a unique product id.
 * 
 * @param {Object} product
 */
function addProduct(product) {
  product.id = id++;
  product.total = addTax(product.price);
  product.timestamp = new Date();
  // include the image manually
  product.image = document.getElementById('files').files[0];

  products.push(product);
  filterProducts();

  console.log('Adding new product', product);
}

function filterProducts(name) {
  var filtered;

  console.log('Filtering products for name: %s', name);

  if (name) {
    filtered = products.filter(function(product) {
      return product.name.indexOf(name) >= 0;
    });
  } else {
    filtered = products;
  }

  var body = $('#products-table > tbody');
  if (filtered.length > 0) {
    body.html('');
    filtered.forEach(function(product) {
      var row = document.createElement('tr');
      var img = new Image();
      row.insertCell(0).innerHTML = product.name;
      row.insertCell(1).innerHTML = product.barcode;
      row.insertCell(2).innerHTML = product.description || '';
      row.insertCell(3).innerHTML = product.kind || '';
      row.insertCell(4).innerHTML = product.price || '';
      row.insertCell(5).innerHTML = product.total || '';
      row.insertCell(6).appendChild(img);
      row.insertCell(7).innerHTML = formatDate(product.timestamp);

      body.append(row);
      previewImage(img, product.image);
    });
  } else {
    $('#products-table > tbody').html('<tr><td class="empty" colspan="8">Nepostojeci prozivod</td></tr>');
  }
}

function previewImage(target, image) {
  if (!target || !image) {
    return;
  }
  // read the file data and set them as the image source
  var reader = new FileReader();
  reader.onload = function(e) {
    target.src = e.target.result;
  };
  reader.readAsDataURL(image);
}

$(function() {
  var form = $('#product-form').on('submit', function() {
    // Validate each field
    form.find('.form-control').each(function(i, field) {
      validateField($(field));
    });

    // if the field is valid, add a new product and clear the form values
    if (form.find('.has-error').length === 0) {
      addProduct(objectifyForm(form));

      // reset values
      form.find('.form-control').each(function(i, field) {
        $(field).val(null);
      });
      // clear preview image
      $('#preview').html('');

      // show success message
      showAlert('Proizvod je uspesno dodat', 'success');
    } else {
      // show error validation message
      showAlert('Forma nije validna', 'danger');
    }

    return false;
  });

  // Perform validation on each keypress, change and blur
  form.find('.form-control').on('keypress change blur', function() {
    validateField($(this));
  });

  // calculate the price with tax and add the value to the disabled field
  $('#price').on('change keyup', function() {
    $('#total').val(addTax(this.value));
  });

  // Show the image preview on file input change
  $('#files').on('change', function(e) {
    var field = $(this);
    if (field.data('valid') && this.files.length > 0) {
      // create a new image element and append it to #preview
      var img = new Image();
      $('#preview').html(img);
      previewImage(img, this.files[0]);
    }
  });

  // Search products
  $('.search-field').on('keyup', function() {
    filterProducts(this.value);
  });
});
