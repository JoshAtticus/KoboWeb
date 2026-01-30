// KoboWeb JS Test Suite
// Written in very old JS to ensure it runs on S40

window.onload = function() {
    var ua = navigator.userAgent;
    var uaEl = document.getElementById('ua');
    if (uaEl) {
        uaEl.innerHTML = ua;
    }

    var tests = [
        { name: 'basic_variables', type: 'Essential', test: function() { var x = 1; return x === 1; } },
        { name: 'document.getElementById', type: 'Essential', test: function() { return !!document.getElementById('ua'); } },
        { name: 'innerHTML', type: 'Essential', test: function() { var d = document.createElement('div'); d.innerHTML = 'test'; return d.innerHTML === 'test'; } },
        { name: 'JSON.parse', type: 'Essential', test: function() { try { var o = JSON.parse('{"a":1}'); return o.a === 1; } catch(e) { return false; } } },
        { name: 'XMLHttpRequest', type: 'Essential', test: function() { return typeof XMLHttpRequest !== 'undefined' || typeof ActiveXObject !== 'undefined'; } },
        { name: 'Date.now', type: 'Essential', test: function() { return typeof Date.now === 'function' && Date.now() > 0; } },
        { name: 'Array.prototype.push', type: 'Essential', test: function() { var a = []; a.push(1); return a.length === 1; } },
        
        { name: 'localStorage', type: 'Recommended', test: function() { try { return typeof localStorage !== 'undefined'; } catch(e) { return false; } } },
        { name: 'querySelector', type: 'Recommended', test: function() { return typeof document.querySelector === 'function'; } },
        { name: 'addEventListener', type: 'Recommended', test: function() { return typeof window.addEventListener === 'function'; } },
        { name: 'classList', type: 'Recommended', test: function() { var d = document.createElement('div'); return typeof d.classList !== 'undefined'; } },
        { name: 'Array.prototype.forEach', type: 'Recommended', test: function() { return typeof Array.prototype.forEach === 'function'; } },
        { name: 'Object.keys', type: 'Recommended', test: function() { return typeof Object.keys === 'function'; } }
    ];

    var table = document.getElementById('testTable');
    
    for (var i = 0; i < tests.length; i++) {
        var t = tests[i];
        var tr = document.createElement('tr');
        
        var tdName = document.createElement('td');
        tdName.innerHTML = t.name;
        tr.appendChild(tdName);
        
        var tdType = document.createElement('td');
        tdType.innerHTML = t.type;
        tr.appendChild(tdType);
        
        var tdStatus = document.createElement('td');
        tdStatus.className = 'pending';
        tdStatus.innerHTML = 'Running...';
        tr.appendChild(tdStatus);
        
        table.appendChild(tr);
        
        try {
            var result = t.test();
            if (result) {
                tdStatus.className = 'success';
                tdStatus.innerHTML = 'PASS ✓';
            } else {
                tdStatus.className = 'fail';
                tdStatus.innerHTML = 'FAIL ✗';
            }
        } catch (e) {
            tdStatus.className = 'fail';
            tdStatus.innerHTML = 'ERROR: ' + e.message;
        }
    }
};