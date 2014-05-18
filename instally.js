var app = angular.module('app', []);

app.config(['$compileProvider', function($compileProvider) {
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|data):/);
}]);

var uint8ToString = function(buf) {
  var i, length, out = '';
  for (i = 0, length = buf.length; i < length; i += 1) {
    out += String.fromCharCode(buf[i]);
  }
  return out;
}

app.controller('instally', ['$scope', function($scope){
  var buildScript = function(){
    var selected = [];
    for (var i in $scope.apps) {
      if ($scope.apps[i].selected) {
        selected.push($scope.apps[i]);
      }
    }
    if (!selected.length) {
      return false;
    }
    var script = [];
    var initialPackages = {};
    var update = false;
    var needsBits = false;

    selected.forEach(function(app){
      if (app.ppa) {
        initialPackages['python-software-properties'] = true;
        script.push('add-apt-repository -y "'+app.ppa+'"');
        update = true;
      }
      if (app.keyfile) {
        initialPackages.wget = true;
        script.push('wget -O - '+app.keyfile+' | apt-key add -');
      }
      if (app.keyserver && app.keycode) {
        script.push('apt-key adv --keyserver '+app.keyserver+' --recv-keys '+app.keycode);
      }
    });
    if (update) {
      script.push('apt-get -y update');
    }
    var packages = [];
    selected.forEach(function(app){
      if (app.package) {
        packages.push(app.package);
      }
      if (app.deb) {
        initialPackages.wget = true;
        if (typeof app.deb == 'string') {
          script.push('FILE=`mktemp`');
          script.push('wget -O $FILE '+app.deb);
          script.push('dpkg --install $FILE');
        } else {
          needsBits = true;
          script.push('FILE=`mktemp`');
          script.push('if [ ${MACHINE_TYPE} == "x86_64" ]');
          script.push('  then wget -O $FILE '+app.deb['amd64']);
          script.push('  else wget -O $FILE '+app.deb['i386']);
          script.push('fi');
          script.push('dpkg --install $FILE');
        }
      }
    });
    if (packages.length) {
      script.push('apt-get -y install '+packages.join(' '));
    }
    initialPackages = Object.keys(initialPackages);
    if (initialPackages.length) {
      script.unshift('apt-get -y install '+initialPackages.join(' '));
    }
    if (needsBits) {
      script.unshift('MACHINE_TYPE=`uname -m`');
    }
    script.push('echo "Instally is finished"');
    return script.join(';\n')+';';
  };

  $scope.prepare = function(){
    $scope.script = buildScript();

    var Tar = require('tar-js');
    var tape = new Tar();

    var header = "echo 'Welcome to Instally. Enter your password to continue.';"

    var desktopFile = '[Desktop Entry]\nType=Application\nVersion=1.0\nName=Instally\nTerminal=true\nExec=bash -c "export PATH=$PATH:`dirname %k`;'+header+' sudo script.sh"';
    tape.append('instally/instally.desktop', desktopFile);
    tape.append('instally/script.sh', $scope.script);


    var uri = "data:application/tar;base64," + btoa(uint8ToString(tape.out));

    $scope.downloadUri = uri;
  };
  $scope.showScript = function(){
    $scope.scriptVisible = true;
  };
  $scope.hideScript = function(){
    $scope.scriptVisible = false;
  };

  var apps = [];

  apps.push({
    category: 'Browsers',
    title: 'Chrome',
    icon: 'icons/chrome.png',
    deb: {
      'amd64': 'https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb',
      'i386': 'https://dl.google.com/linux/direct/google-chrome-stable_current_i386.deb'
    }
  });

  apps.push({
    category: 'Browsers',
    title: 'Firefox',
    icon: 'icons/firefox.png',
    package: 'firefox'
  });
  apps.push({
    category: 'Browsers',
    title: 'Opera',
    icon: 'icons/opera.png',
    ppa: 'deb http://deb.opera.com/opera/ stable non-free',
    keyfile: 'http://deb.opera.com/archive.key',
    package: 'opera'
  });
  apps.push({
    category: 'Browsers',
    title: 'Midori',
    icon: 'icons/midori.png',
    ppa: 'ppa:midori/ppa',
    package: 'midori'
  });

  apps.push({
    category: 'Fun',
    title: 'Steam',
    icon: 'icons/steam.png',
    deb: 'http://media.steampowered.com/client/installer/steam.deb'
  });

  apps.push({
    category: 'Fun',
    title: 'Minecraft',
    icon: 'icons/minecraft.png',
    ppa: 'ppa:minecraft-installer-peeps/minecraft-installer',
    package: 'minecraft-installer'
  });

  apps.push({
    category: 'Fun',
    title: 'Cheese',
    icon: 'icons/cheese.png',
    package: 'cheese'
  });

  apps.push({
    category: 'Media',
    title: 'Spotify',
    icon: 'icons/spotify.png',
    ppa: 'deb http://repository.spotify.com stable non-free',
    keyserver: 'keyserver.ubuntu.com',
    keycode: '94558F59',
    package: 'spotify-client'
  });

  apps.push({
    category: 'Media',
    title: 'Netflix',
    icon: 'icons/netflix.png',
    ppa: 'ppa:ehoover/compholio',
    package: 'netflix-desktop'
  });

  apps.push({
    category: 'Media',
    title: 'Hulu',
    icon: 'icons/hulu.png',
    deb: {
      'amd64': 'http://download.hulu.com/huludesktop_amd64.deb',
      'i386': 'http://download.hulu.com/huludesktop_i386.deb' 
    }
  });

  apps.push({
    category: 'Media',
    title: 'VLC',
    icon: 'icons/vlc.png',
    package: 'vlc'
  });

  apps.push({
    category: 'Communication',
    title: 'Skype',
    icon: 'icons/skype.png',
    ppa: 'deb http://archive.canonical.com/ $(lsb_release -sc) partner',
    package: 'skype'
  });

  apps.push({
    category: 'Communication',
    title: 'Thunderbird',
    icon: 'icons/thunderbird.png',
    package: 'thunderbird'
  });
  
  apps.push({
    category: 'Communication',
    title: 'Geary',
    icon: 'icons/geary.png',
    package: 'geary'
  });

  apps.push({
    category: 'Tools',
    title: 'Dropbox',
    icon: 'icons/dropbox.png',
    package: 'nautilus-dropbox'
  });

  apps.push({
    category: 'Tools',
    title: 'Transmission',
    icon: 'icons/transmission.png',
    package: 'transmission'
  });

  apps.push({
    category: 'Tools',
    title: 'Wine',
    icon: 'icons/wine.png',
    ppa: 'ppa:ubuntu-wine/ppa',
    package: 'wine1.7'
  });

  apps.push({
    category: 'Tools',
    title: 'Java',
    icon: 'icons/java.png',
    ppa: 'ppa:webupd8team/java',
    package: 'oracle-java7-installer'
  });

  apps.push({
    category: 'Interface',
    title: 'Tweak',
    icon: 'icons/ubuntu-tweak.png',
    ppa: 'ppa:tualatrix/ppa',
    package: 'ubuntu-tweak'
  });

  apps.push({
    category: 'Interface',
    title: 'Docky',
    icon: 'icons/docky.png',
    ppa: 'ppa:docky-core/stable',
    package: 'docky'
  });

  apps.push({
    category: 'Creative',
    title: 'LibreOffice',
    icon: 'icons/libreoffice.png',
    package: 'libreoffice'
  });

  apps.push({
    category: 'Creative',
    title: 'GIMP',
    icon: 'icons/gimp.png',
    package: 'gimp'
  });
  
  apps.push({
    category: 'Creative',
    title: 'Sublime Text',
    icon: 'icons/sublime.png',
    deb: {
      'amd64': 'http://c758482.r82.cf2.rackcdn.com/sublime-text_build-3059_amd64.deb',
      'i386': 'http://c758482.r82.cf2.rackcdn.com/sublime-text_build-3059_i386.deb'
    }
  });

  apps.push({
    category: 'Creative',
    title: 'Blender',
    icon: 'icons/blender.png',
    package: 'blender'
  });  

  $scope.apps = apps;

  //rhythmbox, banshee, clementine, shotwell, 

  $scope.categoryList = ['Browsers', 'Media', 'Tools', 'Creative', 'Fun', 'Interface', 'Communication'];
}]);