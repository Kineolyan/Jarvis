(defproject jarvis "0.1.0-SNAPSHOT"
  :description "Jarvis backed by Clojure"
  :url "https://github.com/Kineolyan/jarvis"
  :license {:name "EPL-2.0 OR GPL-2.0-or-later WITH Classpath-exception-2.0"
            :url "https://www.eclipse.org/legal/epl-2.0/"}
  :dependencies [[org.clojure/clojure "1.10.0"]
                 [tcp-server "0.1.0"]]
  :main ^:skip-aot jarvis.core
  :target-path "target/%s"
  :profiles {:dev {:global-vars {*warn-on-reflection* true
                                 *assert* true}}
             :uberjar {:aot :all
                       :plugins [[io.taylorwood/lein-native-image "0.3.1"]]
                       :native-image {;:graal-bin (str :env/JAVA_HOME "/bin")
                                      :jvm-opts ["-Dclojure.compiler.direct-linking=true"]
                                      :opts ["--verbose"
                                             "--report-unsupported-elements-at-runtime"
                                             "--initialize-at-build-time"]
                                      :name "jarvis-client"}}})
