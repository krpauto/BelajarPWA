'use strict';
var idbApp = (function() {
  if (!('indexedDB' in window)) {
    console.log('Browser Anda tidak mendukung IndexedDB');
    return;
  }
  var dbPromise = idb.open('pesanan', 1, function(upgradeDb) {
    switch (upgradeDb.oldVersion) {
      case 0:
        // switch akan dijalankan ketika database pertama kali dibuat
        // (oldVersion = 0)
      case 1:
        console.log('Buat Object Store produk');
        upgradeDb.createObjectStore('produk', {keyPath: 'id'});
      case 2:
        console.log('Buat index nama');
        var store = upgradeDb.transaction.objectStore('produk');
        store.createIndex('nama', 'nama', {unique: true});
      case 3:
        console.log('Buat index deskripsi dan harga');
        var store = upgradeDb.transaction.objectStore('produk');
        store.createIndex('harga', 'harga');
        store.createIndex('deskripsi', 'deskripsi');
      case 4:
        console.log('Buat object store pesanan');
        upgradeDb.createObjectStore('pesanan', {keyPath: 'id'});
    }
  });

  function addproduk() {
    dbPromise.then(function(db) {
      var tx = db.transaction('produk', 'readwrite');
      var store = tx.objectStore('produk');
      var items = [
        {
          nama: 'Sofa',
          id: 'sofa-01',
          harga: 900000,
          warna: 'coklat',
          material: 'mahogany',
          deskripsi: 'Sofa duduk yang nyaman',
          quantity: 6
        },
        {
          nama: 'Kursi',
          id: 'kur-01',
          harga: 300000,
          warna: 'Putih',
          material: 'pine',
          deskripsi: 'Kursi sofa antik',
          quantity: 7
        },
        {
          nama: 'Kursi tinggi',
          id: 'kur-02',
          harga: 250000,
          warna: 'Merah',
          material: 'pine',
          deskripsi: 'Kursi tinggi yang ringan',
          quantity: 8
        },
        {
          nama: 'Kursi Dapur',
          id: 'kur-03',
          harga: 150000,
          warna: 'Biru',
          material: 'pine',
          deskripsi: 'Kursi untuk ruang makan',
          quantity: 12
        },
        {
          nama: 'Lemari Buku',
          id: 'lmr-01',
          harga: 400000,
          warna: 'Coklat',
          material: 'plywood',
          deskripsi: 'Lemari buku 2 pintu',
          quantity: 6
        },
        {
          nama: 'Lemari Pakaian',
          id: 'lmr-02',
          harga: 800000,
          warna: 'Putih',
          material: 'mahogany',
          deskripsi: 'Lemari pakaian 2 pintu',
          quantity: 5
        }
      ];
      return Promise.all(items.map(function(item) {
          console.log('Adding item: ', item);
          return store.add(item);
        })
      ).catch(function(e) {
        tx.abort();
        console.log(e);
      }).then(function() {
        console.log('Semua produk berhasil ditambahkan!');
      });
    });
  }

  function getBynama(key) {
    return dbPromise.then(function(db) {
      var tx = db.transaction('produk', 'readonly');
      var store = tx.objectStore('produk');
      var index = store.index('nama');
      return index.get(key);
    });
  }

  function displayBynama() {
    var key = document.getElementById('nama').value;
    if (key === '') {return;}
    var s = '';
    getBynama(key).then(function(object) {
      if (!object) {return;}

      s += '<h2>' + object.nama + '</h2><p>';
      for (var field in object) {
        s += field + ' = ' + object[field] + '<br/>';
      }
      s += '</p>';

    }).then(function() {
      if (s === '') {s = '<p>Produk tidak tersedia.</p>';}
      document.getElementById('results').innerHTML = s;
    });
  }

  function getByharga() {
    var lower = document.getElementById('hargaLower').value;
    var upper = document.getElementById('hargaUpper').value;
    var lowerNum = Number(document.getElementById('hargaLower').value);
    var upperNum = Number(document.getElementById('hargaUpper').value);

    if (lower === '' && upper === '') {return;}
    var range;
    if (lower !== '' && upper !== '') {
      range = IDBKeyRange.bound(lowerNum, upperNum);
    } else if (lower === '') {
      range = IDBKeyRange.upperBound(upperNum);
    } else {
      range = IDBKeyRange.lowerBound(lowerNum);
    }
    var s = '';
    dbPromise.then(function(db) {
      var tx = db.transaction('produk', 'readonly');
      var store = tx.objectStore('produk');
      var index = store.index('harga');
      return index.openCursor(range);
    }).then(function showRange(cursor) {
      if (!cursor) {return;}
      console.log('Cursored di:', cursor.value.nama);
      s += '<h2>Harga : Rp.' + cursor.value.harga + '</h2><p>';
      for (var field in cursor.value) {
        s += field + '=' + cursor.value[field] + '<br/>';
      }
      s += '</p>';
      return cursor.continue().then(showRange);
    }).then(function() {
      if (s === '') {s = '<p>Produk tidak tersedia.</p>';}
      document.getElementById('results').innerHTML = s;
    });
  }

  function getByDesc() {
    var key = document.getElementById('desc').value;
    if (key === '') {return;}
    var range = IDBKeyRange.only(key);
    var s = '';
    dbPromise.then(function(db) {
      var tx = db.transaction('produk', 'readonly');
      var store = tx.objectStore('produk');
      var index = store.index('deskripsi');
      return index.openCursor(range);
    }).then(function showRange(cursor) {
      if (!cursor) {return;}
      console.log('Cursored at:', cursor.value.nama);
      s += '<h2>harga - ' + cursor.value.harga + '</h2><p>';
      for (var field in cursor.value) {
        s += field + '=' + cursor.value[field] + '<br/>';
      }
      s += '</p>';
      return cursor.continue().then(showRange);
    }).then(function() {
      if (s === '') {s = '<p>Produk tidak tersedia.</p>';}
      document.getElementById('results').innerHTML = s;
    });
  }

  function tambahpesanan() {
    dbPromise.then(function(db) {
      var tx = db.transaction('pesanan', 'readwrite');
      var store = tx.objectStore('pesanan');
      var items = [
        {
          nama: 'Lemari Pakaian',
          id: 'lmr-02',
          harga: 800000,
          warna: 'Putih',
          material: 'mahogany',
          deskripsi: 'Lemari pakaian 2 pintu',
          quantity: 1
        },
        {
          nama: 'Kursi Dapur',
          id: 'kur-03',
          harga: 150000,
          warna: 'Biru',
          material: 'pine',
          deskripsi: 'Kursi untuk ruang makan',
          quantity: 4
        },
        {
          nama: 'Sofa',
          id: 'sofa-01',
          harga: 900000,
          warna: 'coklat',
          material: 'mahogany',
          deskripsi: 'Sofa duduk yang nyaman',
          quantity: 1
        }
      ];
      return Promise.all(items.map(function(item) {
          console.log('Adding item: ', item);
          return store.add(item);
        })
      ).then(function() {
        console.log('Semua pesanan sudah masuk.');
      }).catch(function(e) {
        tx.abort();
        console.log(e);
      });
    });
  }

  function tampilkanpesanan() {
    var s = '';
    dbPromise.then(function(db) {
      var tx = db.transaction('pesanan', 'readonly');
      var store = tx.objectStore('pesanan');
      return store.openCursor();
    }).then(function showRange(cursor) {
      if (!cursor) {return;}
      console.log('Cursored at:', cursor.value.nama);

      s += '<h2>' + cursor.value.nama + '</h2><p>';
      for (var field in cursor.value) {
        s += field + '=' + cursor.value[field] + '<br/>';
      }
      s += '</p>';
      return cursor.continue().then(showRange);
    }).then(function() {
      if (s === '') {s = '<p>Belum ada pesanan.</p>';}
      document.getElementById('pesanan').innerHTML = s;
    });
  }

  function getpesanan() {
    return dbPromise.then(function(db) {
      var tx = db.transaction('pesanan', 'readonly');
      var store = tx.objectStore('pesanan');
      return store.getAll();
    });
  }

  function fulfillpesanan() {
    getpesanan().then(function(pesanan) {
      return processpesanan(pesanan);
    }).then(function(updatedproduk) {
      updateprodukStore(updatedproduk);
    });
  }

  function processpesanan(pesanan) {
    return dbPromise.then(function(db) {
      var tx = db.transaction('produk');
      var store = tx.objectStore('produk');
      return Promise.all(
        pesanan.map(function(order) {
          return store.get(order.id).then(function(product) {
            return decrementQuantity(product, order);
          });
        })
      );
    });
  }

  function decrementQuantity(product, order) {
    return new Promise(function(resolve, reject) {
      var item = product;
      var qtyRemaining = item.quantity - order.quantity;
      if (qtyRemaining < 0) {
        console.log('Not enough ' + product.id + ' left in stock!');
        document.getElementById('receipt').innerHTML =
        '<h3>Stok produk ' + product.id + ' sudah habis!</h3>';
        throw 'Out of stock!';
      }
      item.quantity = qtyRemaining;
      resolve(item);
    });
  }

  function updateprodukStore(produk) {
    dbPromise.then(function(db) {
      var tx = db.transaction('produk', 'readwrite');
      var store = tx.objectStore('produk');
      return Promise.all(produk.map(function(item) {
          return store.put(item);
        })
      ).catch(function(e) {
        tx.abort();
        console.log(e);
      }).then(function() {
        console.log('Pesanan sudah di proses!');
        document.getElementById('receipt').innerHTML =
        '<h3>Pesanan sudah di proses!</h3>';
      });
    });
  }

  return {
    dbPromise: (dbPromise),
    addproduk: (addproduk),
    getBynama: (getBynama),
    displayBynama: (displayBynama),
    getByharga: (getByharga),
    getByDesc: (getByDesc),
    tambahpesanan: (tambahpesanan),
    tampilkanpesanan: (tampilkanpesanan),
    getpesanan: (getpesanan),
    fulfillpesanan: (fulfillpesanan),
    processpesanan: (processpesanan),
    decrementQuantity: (decrementQuantity),
    updateprodukStore: (updateprodukStore)
  };
})();
