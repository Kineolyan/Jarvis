(ns jarvis.config
  (:require [clojure.edn :as edn]
            [clojure.java.io :as io])
  (:import [java.nio.file Path]))
(set! *warn-on-reflection* 1)

(def config-registry (atom {}))

(defn register-config
  "Registers a config file for a given key."
  [k file]
  (let [absolute-path (-> file (Path/of (into-array String [])) (.toAbsolutePath) (.toString))]
    (swap! config-registry assoc k absolute-path)))

(defn get-config-file
  "Safely gets the file name storing a configuration."
  [k]
  (let [filename (get @config-registry k)]
    (when-not filename (throw (IllegalArgumentException. (str "No config for " k))))
    filename))

(defn read-config
  "Reads the config for a given key k."
  [k]
  (let [filename  (get-config-file k)] 
    (if (.exists (io/file filename))
      (-> filename slurp edn/read-string)
      nil)))

(defn write-config
  "Writes the passed configuration for the key k."
  [k content]
  (-> (get-config-file k) (spit (pr-str content))))

(defn update-config
  [k f]
  (->> (read-config k)
       (f)
       (write-config k)))

(comment
  (def file "/tmp/jarvis-git.edn")
  (register-config 'git file)

  (write-config 'git {'path "here" 'action 'greeting})

  ('path (read-config 'git))

  )