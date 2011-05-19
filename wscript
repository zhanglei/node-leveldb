import Options, glob
from os.path import join, dirname, abspath, exists
from shutil import copy, rmtree
from os import unlink
import sys, os

srcdir = "."
blddir = "build"
VERSION = "0.0.1"
srcdir = abspath(srcdir)
leveldbdir = srcdir + "/deps/leveldb"
leveldbsrc = ["/db/builder.cc", "/db/db_impl.cc", "/db/db_iter.cc", "/db/filename.cc", "/db/dbformat.cc", "/db/log_reader.cc", "/db/log_writer.cc", "/db/memtable.cc", "/db/repair.cc", "/db/table_cache.cc", "/db/version_edit.cc", "/db/version_set.cc", "/db/write_batch.cc", "/port/port_posix.cc", "/table/block.cc", "/table/block_builder.cc", "/table/format.cc", "/table/iterator.cc", "/table/merger.cc", "/table/table.cc", "/table/table_builder.cc", "/table/two_level_iterator.cc", "/util/arena.cc", "/util/cache.cc", "/util/coding.cc", "/util/comparator.cc", "/util/crc32c.cc", "/util/env.cc", "/util/env_posix.cc", "/util/hash.cc", "/util/histogram.cc", "/util/logging.cc", "/util/options.cc", "/util/status.cc"]

def set_options(opt):
  opt.tool_options("compiler_cxx")
  opt.tool_options("compiler_cc")

def configure(conf):
  conf.check_tool("compiler_cxx")
  conf.check_tool("compiler_cc")
  conf.check_tool("node_addon")

def clean(ctx): 
  if exists("build"): rmtree("build")

def build(bld):

  node_leveldb = bld.new_task_gen("cxx", "shlib", "node_addon")
  node_leveldb.source = ["deps/leveldb" + path for path in leveldbsrc] + ["index.cc"]
  node_leveldb.name = "node_leveldb"
  node_leveldb.target = "leveldb"
  node_leveldb.uselib = ["pthread"]
  node_leveldb.includes = [leveldbdir, leveldbdir + '/include']
  node_leveldb.cxxflags = ['-O2', '-DNDEBUG', '-m32', '-DLEVELDB_PLATFORM_POSIX', '-std=c++0x']


